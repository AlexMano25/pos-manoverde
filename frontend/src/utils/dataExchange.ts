/**
 * Data Exchange Engine — Cross-cutting import/export for all modules.
 *
 * Supports: CSV, JSON, XLSX, XML
 * Activity-aware product field schemas (pharmacy→dosage, hotel→room_type, etc.)
 * Validation, template generation, batched Dexie import.
 */
import type { Activity } from '../types'
import { ACTIVITY_PRODUCT_FIELDS } from '../data/activityFields'
import { downloadBlob } from './sharing'

// ── Types ─────────────────────────────────────────────────────────────

export type ExchangeFormat = 'csv' | 'json' | 'xlsx' | 'xml'

export type ExchangeModule =
  | 'products'
  | 'orders'
  | 'customers'
  | 'suppliers'
  | 'employees'
  | 'stock_moves'
  | 'promotions'
  | 'expenses'

export type FieldDescriptor = {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'json'
  required: boolean
  activitySpecific?: boolean
}

export type ValidationError = {
  row: number
  field: string
  message: string
  value: string
}

export type ImportValidation = {
  valid: boolean
  totalRows: number
  validRows: number
  errors: ValidationError[]
  warnings: string[]
  preview: Record<string, unknown>[]
}

export type ExportFilters = {
  dateFrom?: string
  dateTo?: string
  categories?: string[]
  status?: string
  isActive?: boolean
}

export type ImportResult = {
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

// ── Module schemas ────────────────────────────────────────────────────

const PRODUCT_BASE_FIELDS: FieldDescriptor[] = [
  { key: 'name', label: 'Name', type: 'string', required: true },
  { key: 'price', label: 'Price', type: 'number', required: true },
  { key: 'cost', label: 'Cost', type: 'number', required: false },
  { key: 'stock', label: 'Stock', type: 'number', required: true },
  { key: 'min_stock', label: 'Min Stock', type: 'number', required: false },
  { key: 'category', label: 'Category', type: 'string', required: true },
  { key: 'sku', label: 'SKU', type: 'string', required: false },
  { key: 'barcode', label: 'Barcode', type: 'string', required: false },
  { key: 'unit', label: 'Unit', type: 'string', required: false },
  { key: 'is_active', label: 'Active', type: 'boolean', required: false },
]

const CUSTOMER_FIELDS: FieldDescriptor[] = [
  { key: 'name', label: 'Name', type: 'string', required: true },
  { key: 'phone', label: 'Phone', type: 'string', required: false },
  { key: 'email', label: 'Email', type: 'string', required: false },
  { key: 'address', label: 'Address', type: 'string', required: false },
  { key: 'notes', label: 'Notes', type: 'string', required: false },
  { key: 'loyalty_points', label: 'Loyalty Points', type: 'number', required: false },
  { key: 'total_spent', label: 'Total Spent', type: 'number', required: false },
  { key: 'tags', label: 'Tags', type: 'string', required: false },
]

const SUPPLIER_FIELDS: FieldDescriptor[] = [
  { key: 'name', label: 'Name', type: 'string', required: true },
  { key: 'contact_name', label: 'Contact Name', type: 'string', required: false },
  { key: 'email', label: 'Email', type: 'string', required: false },
  { key: 'phone', label: 'Phone', type: 'string', required: false },
  { key: 'address', label: 'Address', type: 'string', required: false },
  { key: 'category', label: 'Category', type: 'string', required: false },
  { key: 'payment_terms', label: 'Payment Terms', type: 'string', required: false },
  { key: 'notes', label: 'Notes', type: 'string', required: false },
  { key: 'is_active', label: 'Active', type: 'boolean', required: false },
]

const ORDER_FIELDS: FieldDescriptor[] = [
  { key: 'receipt_number', label: 'Receipt Number', type: 'string', required: false },
  { key: 'items', label: 'Items (JSON)', type: 'json', required: true },
  { key: 'subtotal', label: 'Subtotal', type: 'number', required: true },
  { key: 'discount', label: 'Discount', type: 'number', required: false },
  { key: 'tax', label: 'Tax', type: 'number', required: false },
  { key: 'total', label: 'Total', type: 'number', required: true },
  { key: 'payment_method', label: 'Payment Method', type: 'string', required: true },
  { key: 'status', label: 'Status', type: 'string', required: false },
  { key: 'customer_name', label: 'Customer Name', type: 'string', required: false },
  { key: 'note', label: 'Note', type: 'string', required: false },
  { key: 'created_at', label: 'Date', type: 'date', required: false },
]

const EMPLOYEE_FIELDS: FieldDescriptor[] = [
  { key: 'name', label: 'Name', type: 'string', required: true },
  { key: 'email', label: 'Email', type: 'string', required: true },
  { key: 'role', label: 'Role', type: 'string', required: true },
  { key: 'pin', label: 'PIN', type: 'string', required: false },
  { key: 'phone', label: 'Phone', type: 'string', required: false },
  { key: 'is_active', label: 'Active', type: 'boolean', required: false },
]

const STOCK_MOVE_FIELDS: FieldDescriptor[] = [
  { key: 'product_id', label: 'Product ID', type: 'string', required: true },
  { key: 'type', label: 'Type (in/out/adjust)', type: 'string', required: true },
  { key: 'qty', label: 'Quantity', type: 'number', required: true },
  { key: 'reason', label: 'Reason', type: 'string', required: false },
  { key: 'reference_id', label: 'Reference ID', type: 'string', required: false },
  { key: 'created_at', label: 'Date', type: 'date', required: false },
]

const PROMOTION_FIELDS: FieldDescriptor[] = [
  { key: 'name', label: 'Name', type: 'string', required: true },
  { key: 'type', label: 'Type', type: 'string', required: true },
  { key: 'value', label: 'Value', type: 'number', required: true },
  { key: 'start_date', label: 'Start Date', type: 'date', required: false },
  { key: 'end_date', label: 'End Date', type: 'date', required: false },
  { key: 'is_active', label: 'Active', type: 'boolean', required: false },
]

const EXPENSE_FIELDS: FieldDescriptor[] = [
  { key: 'category', label: 'Category', type: 'string', required: true },
  { key: 'amount', label: 'Amount', type: 'number', required: true },
  { key: 'description', label: 'Description', type: 'string', required: false },
  { key: 'status', label: 'Status', type: 'string', required: false },
  { key: 'created_at', label: 'Date', type: 'date', required: false },
]

/** Get complete field list for a module+activity combination */
export function getModuleFields(module: ExchangeModule, activity?: Activity): FieldDescriptor[] {
  switch (module) {
    case 'products': {
      const base = [...PRODUCT_BASE_FIELDS]
      if (activity) {
        const actFields = ACTIVITY_PRODUCT_FIELDS[activity] || []
        for (const af of actFields) {
          const labelParts = af.i18nKey.split('.')
          base.push({
            key: af.key,
            label: labelParts[labelParts.length - 1]
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, s => s.toUpperCase())
              .trim(),
            type: af.inputType === 'number' ? 'number' : af.inputType === 'date' ? 'date' : 'string',
            required: false,
            activitySpecific: true,
          })
        }
      }
      return base
    }
    case 'customers': return [...CUSTOMER_FIELDS]
    case 'suppliers': return [...SUPPLIER_FIELDS]
    case 'orders': return [...ORDER_FIELDS]
    case 'employees': return [...EMPLOYEE_FIELDS]
    case 'stock_moves': return [...STOCK_MOVE_FIELDS]
    case 'promotions': return [...PROMOTION_FIELDS]
    case 'expenses': return [...EXPENSE_FIELDS]
    default: return []
  }
}

// ── CSV Parser (RFC 4180 compliant) ───────────────────────────────────

function parseCSVRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        cells.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  cells.push(current.trim())
  return cells
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') inQuotes = !inQuotes
    if (!inQuotes && (ch === '\n' || (ch === '\r' && text[i + 1] === '\n'))) {
      if (current.trim()) lines.push(current)
      current = ''
      if (ch === '\r') i++
    } else {
      current += ch
    }
  }
  if (current.trim()) lines.push(current)
  return lines
}

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^\uFEFF/, '')
  const lines = splitCSVLines(clean)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVRow(lines[0])
  const rows = lines.slice(1).map(parseCSVRow)
  return { headers, rows }
}

// ── JSON Parser ───────────────────────────────────────────────────────

export function parseJSON(text: string): Record<string, unknown>[] {
  const parsed = JSON.parse(text)
  if (Array.isArray(parsed)) return parsed
  if (parsed && parsed.data && Array.isArray(parsed.data)) return parsed.data
  throw new Error('JSON must be an array or { data: [...] }')
}

// ── XML Parser ────────────────────────────────────────────────────────

export function parseXML(text: string): { headers: string[]; rows: string[][] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')
  const error = doc.querySelector('parsererror')
  if (error) throw new Error('Invalid XML: ' + error.textContent?.slice(0, 100))
  const records = doc.querySelectorAll('record')
  if (records.length === 0) throw new Error('No <record> elements found')
  const headers = Array.from(records[0].children).map(el => el.tagName)
  const rows = Array.from(records).map(rec =>
    headers.map(h => rec.querySelector(h)?.textContent || '')
  )
  return { headers, rows }
}

// ── XLSX Parser (dynamic import for code splitting) ───────────────────

export async function parseXLSX(buffer: ArrayBuffer): Promise<{ headers: string[]; rows: string[][] }> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 })
  const headers = ((data[0] as string[]) || []).map(String)
  const rows = data.slice(1).map((row: unknown[]) => headers.map((_, i) => String((row as string[])[i] ?? '')))
  return { headers, rows }
}

// ── Unified file parser ───────────────────────────────────────────────

export async function parseFile(
  file: File,
  format: ExchangeFormat
): Promise<{ headers: string[]; rows: string[][] }> {
  if (format === 'json') {
    const text = await file.text()
    const records = parseJSON(text)
    if (records.length === 0) return { headers: [], rows: [] }
    const headers = Object.keys(records[0])
    const rows = records.map(r => headers.map(h => String(r[h] ?? '')))
    return { headers, rows }
  }
  if (format === 'csv') {
    const text = await file.text()
    return parseCSV(text)
  }
  if (format === 'xml') {
    const text = await file.text()
    return parseXML(text)
  }
  if (format === 'xlsx') {
    const buffer = await file.arrayBuffer()
    return parseXLSX(buffer)
  }
  throw new Error(`Unsupported format: ${format}`)
}

// ── CSV Generator ─────────────────────────────────────────────────────

const BOM = '\uFEFF'

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n'))
    return `"${value.replace(/"/g, '""')}"`
  return `"${value}"`
}

export function generateCSV(headers: string[], rows: string[][]): string {
  return BOM + [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n')
}

// ── JSON Generator ────────────────────────────────────────────────────

export function generateJSON(keys: string[], rows: string[][]): string {
  const records = rows.map(row => {
    const obj: Record<string, string> = {}
    keys.forEach((k, i) => { obj[k] = row[i] || '' })
    return obj
  })
  return JSON.stringify({ data: records, exportedAt: new Date().toISOString(), count: records.length }, null, 2)
}

// ── XML Generator ─────────────────────────────────────────────────────

function sanitizeXMLTag(tag: string): string {
  return tag.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[^a-zA-Z_]/, '_')
}

function escapeXMLValue(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function generateXML(keys: string[], rows: string[][]): string {
  const xmlRows = rows.map(row => {
    const fields = keys.map((k, i) =>
      `    <${sanitizeXMLTag(k)}>${escapeXMLValue(row[i] || '')}</${sanitizeXMLTag(k)}>`
    ).join('\n')
    return `  <record>\n${fields}\n  </record>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<records count="${rows.length}">\n${xmlRows}\n</records>`
}

// ── XLSX Generator ────────────────────────────────────────────────────

export async function generateXLSX(headers: string[], rows: string[][]): Promise<Blob> {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  // Auto-width columns
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(h.length, ...rows.map(r => (r[i] || '').length))
    return { wch: Math.min(maxLen + 2, 40) }
  })
  ws['!cols'] = colWidths
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ── Format value for export ───────────────────────────────────────────

function formatExportValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return ''
  if (type === 'json') {
    return typeof value === 'string' ? value : JSON.stringify(value)
  }
  if (type === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (type === 'date' && value) {
    const d = new Date(String(value))
    return isNaN(d.getTime()) ? String(value) : d.toISOString().slice(0, 10)
  }
  return String(value)
}

// ── Coerce imported value to proper type ──────────────────────────────

function coerceValue(raw: string, type: string): unknown {
  const v = (raw || '').trim()
  if (!v) return type === 'number' ? 0 : type === 'boolean' ? false : ''
  switch (type) {
    case 'number': {
      // Strip currency symbols and thousands separators
      const cleaned = v.replace(/[^0-9.\-,]/g, '').replace(/,/g, '')
      const n = Number(cleaned)
      return isNaN(n) ? 0 : n
    }
    case 'boolean':
      return ['true', 'yes', '1', 'oui', 'si', 'ja'].includes(v.toLowerCase())
    case 'date': {
      // Try ISO first, then DD/MM/YYYY, then MM/DD/YYYY
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
        const [a, b, y] = v.split('/')
        const day = parseInt(a, 10)
        return day > 12 ? `${y}-${b}-${a}` : `${y}-${a}-${b}`
      }
      return v
    }
    case 'json': {
      try { JSON.parse(v); return v } catch { return v }
    }
    default:
      return v
  }
}

// ── Export dispatcher ─────────────────────────────────────────────────

export async function exportData(
  module: ExchangeModule,
  format: ExchangeFormat,
  data: Record<string, unknown>[],
  activity?: Activity,
  storeName?: string
): Promise<void> {
  const fields = getModuleFields(module, activity)
  const headers = fields.map(f => f.label)
  const keys = fields.map(f => f.key)
  const rows = data.map(record =>
    fields.map(f => formatExportValue(record[f.key], f.type))
  )
  const timestamp = new Date().toISOString().slice(0, 10)
  const baseName = `${storeName || 'export'}_${module}_${timestamp}`

  switch (format) {
    case 'csv': {
      const csv = generateCSV(headers, rows)
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${baseName}.csv`)
      break
    }
    case 'json': {
      const json = generateJSON(keys, rows)
      downloadBlob(new Blob([json], { type: 'application/json;charset=utf-8;' }), `${baseName}.json`)
      break
    }
    case 'xml': {
      const xml = generateXML(keys, rows)
      downloadBlob(new Blob([xml], { type: 'application/xml;charset=utf-8;' }), `${baseName}.xml`)
      break
    }
    case 'xlsx': {
      const blob = await generateXLSX(headers, rows)
      downloadBlob(blob, `${baseName}.xlsx`)
      break
    }
  }
}

// ── Validation ────────────────────────────────────────────────────────

function buildHeaderMap(headers: string[], fields: FieldDescriptor[]): Map<number, FieldDescriptor> {
  const map = new Map<number, FieldDescriptor>()
  for (const field of fields) {
    const colIdx = headers.findIndex(h => {
      const hNorm = h.toLowerCase().trim()
      return hNorm === field.key.toLowerCase() || hNorm === field.label.toLowerCase()
    })
    if (colIdx >= 0) map.set(colIdx, field)
  }
  return map
}

export function validateImportData(
  headers: string[],
  rows: string[][],
  module: ExchangeModule,
  activity?: Activity,
): ImportValidation {
  const fields = getModuleFields(module, activity)
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const headerMap = buildHeaderMap(headers, fields)

  // Check required columns presence
  for (const field of fields) {
    if (field.required) {
      const found = [...headerMap.values()].some(f => f.key === field.key)
      if (!found) warnings.push(`Required column "${field.label}" (${field.key}) not found in file`)
    }
  }

  const validRowIdxs: number[] = []

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    let rowValid = true

    for (const [colIdx, field] of headerMap.entries()) {
      const value = (row[colIdx] || '').trim()

      if (field.required && !value) {
        errors.push({ row: rowIdx + 2, field: field.key, message: `${field.label} is required`, value })
        rowValid = false
        continue
      }
      if (!value) continue

      if (field.type === 'number') {
        const cleaned = value.replace(/[^0-9.\-,]/g, '').replace(/,/g, '')
        if (isNaN(Number(cleaned))) {
          errors.push({ row: rowIdx + 2, field: field.key, message: `${field.label} must be a number`, value })
          rowValid = false
        }
      }
      if (field.type === 'date' && isNaN(Date.parse(value)) && !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        errors.push({ row: rowIdx + 2, field: field.key, message: `${field.label} must be a valid date`, value })
        rowValid = false
      }
      if (field.type === 'boolean' && !['true', 'false', 'yes', 'no', '1', '0', 'oui', 'non', 'si'].includes(value.toLowerCase())) {
        errors.push({ row: rowIdx + 2, field: field.key, message: `${field.label} must be true/false`, value })
        rowValid = false
      }
    }

    if (rowValid) validRowIdxs.push(rowIdx)
  }

  // Preview first 10 valid rows
  const preview = validRowIdxs.slice(0, 10).map(idx => {
    const obj: Record<string, unknown> = {}
    for (const [colIdx, field] of headerMap.entries()) {
      obj[field.key] = coerceValue(rows[idx][colIdx], field.type)
    }
    return obj
  })

  return {
    valid: errors.length === 0 && warnings.filter(w => w.includes('Required')).length === 0,
    totalRows: rows.length,
    validRows: validRowIdxs.length,
    errors: errors.slice(0, 100), // limit displayed errors
    warnings,
    preview,
  }
}

// ── Template generation ───────────────────────────────────────────────

function generateSampleRows(fields: FieldDescriptor[], count: number): string[][] {
  const samples: Record<string, string[]> = {
    name: ['Sample Product 1', 'Widget Pro', 'Service Basic'],
    price: ['1500', '3000', '500'],
    cost: ['1000', '2000', '300'],
    stock: ['50', '100', '25'],
    min_stock: ['5', '10', '3'],
    category: ['Category A', 'Category B', 'Category C'],
    sku: ['SKU-001', 'SKU-002', 'SKU-003'],
    barcode: ['1234567890123', '9876543210987', '5555555555555'],
    unit: ['piece', 'kg', 'litre'],
    email: ['john@example.com', 'jane@example.com', 'bob@example.com'],
    phone: ['+237 690 000 001', '+237 690 000 002', '+237 690 000 003'],
    address: ['123 Main St', '456 Oak Ave', '789 Pine Rd'],
    role: ['cashier', 'manager', 'admin'],
    type: ['in', 'out', 'adjust'],
    qty: ['10', '5', '20'],
    amount: ['5000', '12000', '3500'],
    dosage: ['500mg', '250mg', '100mg'],
    manufacturer: ['Brand A', 'Brand B', 'Brand C'],
    author: ['Author One', 'Author Two', 'Author Three'],
    isbn: ['978-3-16-148410-0', '978-1-23-456789-7', '978-0-00-000000-0'],
    room_type: ['single', 'double', 'suite'],
    room_number: ['101', '202', '301'],
    size: ['S', 'M', 'L'],
    color: ['Red', 'Blue', 'Black'],
    destination: ['Paris', 'New York', 'Tokyo'],
    weight_kg: ['0.5', '1.0', '2.5'],
    duration_minutes: ['30', '60', '90'],
    vehicle_type: ['car', 'moto', 'truck'],
    age_group: ['3-6', '6-12', '12-18'],
    expiry_date: ['2027-06-15', '2027-12-31', '2028-03-01'],
  }

  return Array.from({ length: count }, (_, i) =>
    fields.map(f => {
      if (samples[f.key]) return samples[f.key][i % samples[f.key].length]
      switch (f.type) {
        case 'number': return String((i + 1) * 100)
        case 'date': return new Date(Date.now() + (i + 1) * 86400000 * 30).toISOString().slice(0, 10)
        case 'boolean': return 'true'
        case 'json': return JSON.stringify([{ product_id: 'p1', name: 'Item', price: 1000, qty: i + 1 }])
        default: return `Sample ${f.label} ${i + 1}`
      }
    })
  )
}

export async function downloadTemplate(
  module: ExchangeModule,
  format: ExchangeFormat,
  activity?: Activity
): Promise<void> {
  const fields = getModuleFields(module, activity)
  const headers = fields.map(f => f.label)
  const keys = fields.map(f => f.key)
  const sampleRows = generateSampleRows(fields, 3)
  const baseName = `template_${module}${activity ? '_' + activity : ''}`

  switch (format) {
    case 'csv': {
      const csv = generateCSV(headers, sampleRows)
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${baseName}.csv`)
      break
    }
    case 'json': {
      const json = generateJSON(keys, sampleRows)
      downloadBlob(new Blob([json], { type: 'application/json;charset=utf-8;' }), `${baseName}.json`)
      break
    }
    case 'xml': {
      const xml = generateXML(keys, sampleRows)
      downloadBlob(new Blob([xml], { type: 'application/xml;charset=utf-8;' }), `${baseName}.xml`)
      break
    }
    case 'xlsx': {
      const blob = await generateXLSX(headers, sampleRows)
      downloadBlob(blob, `${baseName}.xlsx`)
      break
    }
  }
}

// ── Import executor (writes to Dexie) ─────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function applyModuleDefaults(module: ExchangeModule, record: Record<string, unknown>): void {
  switch (module) {
    case 'products':
      if (record.is_active === undefined) record.is_active = true
      if (record.stock === undefined) record.stock = 0
      if (record.synced === undefined) record.synced = false
      break
    case 'customers':
      if (record.loyalty_points === undefined) record.loyalty_points = 0
      if (record.total_spent === undefined) record.total_spent = 0
      if (record.visit_count === undefined) record.visit_count = 0
      break
    case 'suppliers':
      if (record.is_active === undefined) record.is_active = true
      if (record.synced === undefined) record.synced = false
      break
    case 'employees':
      if (record.is_active === undefined) record.is_active = true
      break
    case 'orders':
      if (record.status === undefined) record.status = 'completed'
      if (record.synced === undefined) record.synced = false
      break
    case 'stock_moves':
      if (record.synced === undefined) record.synced = false
      break
    case 'promotions':
      if (record.is_active === undefined) record.is_active = true
      break
    case 'expenses':
      if (record.status === undefined) record.status = 'pending'
      break
  }
}

const TABLE_MAP: Record<ExchangeModule, string> = {
  products: 'products',
  orders: 'orders',
  customers: 'customers',
  suppliers: 'suppliers',
  employees: 'users',
  stock_moves: 'stock_moves',
  promotions: 'promotions',
  expenses: 'expenses',
}

// Duplicate detection key fields
const DUPLICATE_KEYS: Partial<Record<ExchangeModule, string[]>> = {
  products: ['sku', 'barcode'],
  customers: ['email', 'phone'],
  suppliers: ['name', 'email'],
  employees: ['email'],
}

export async function executeImport(
  module: ExchangeModule,
  headers: string[],
  rows: string[][],
  storeId: string,
  activity?: Activity,
  mode: 'insert' | 'upsert' = 'insert',
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const fields = getModuleFields(module, activity)
  const headerMap = buildHeaderMap(headers, fields)
  const { db } = await import('../db/dexie')
  const now = new Date().toISOString()
  const tableName = TABLE_MAP[module]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (db as any)[tableName]

  let imported = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  // Pre-load existing records for duplicate detection
  const dupKeys = DUPLICATE_KEYS[module] || []
  const existingMap = new Map<string, string>() // key_value → id
  if (dupKeys.length > 0 && mode === 'upsert') {
    try {
      const existing = await table.where('store_id').equals(storeId).toArray()
      for (const rec of existing) {
        for (const dk of dupKeys) {
          if (rec[dk]) existingMap.set(`${dk}:${String(rec[dk]).toLowerCase()}`, rec.id)
        }
      }
    } catch { /* table may not have store_id index */ }
  }

  const BATCH_SIZE = 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    for (let j = 0; j < batch.length; j++) {
      const rowIdx = i + j
      try {
        const record: Record<string, unknown> = {}
        for (const [colIdx, field] of headerMap.entries()) {
          record[field.key] = coerceValue(batch[j][colIdx], field.type)
        }

        record.store_id = storeId
        record.updated_at = now

        applyModuleDefaults(module, record)

        // Check for duplicates in upsert mode
        let existingId: string | undefined
        if (mode === 'upsert') {
          for (const dk of dupKeys) {
            const val = record[dk]
            if (val) {
              existingId = existingMap.get(`${dk}:${String(val).toLowerCase()}`)
              if (existingId) break
            }
          }
        }

        if (existingId) {
          record.id = existingId
          await table.update(existingId, record)
          updated++
        } else {
          record.id = generateId()
          record.created_at = record.created_at || now
          await table.add(record)
          imported++
          // Register new record for subsequent duplicate checks
          for (const dk of dupKeys) {
            if (record[dk]) existingMap.set(`${dk}:${String(record[dk]).toLowerCase()}`, record.id as string)
          }
        }
      } catch (err) {
        skipped++
        errors.push(`Row ${rowIdx + 2}: ${(err as Error).message}`)
      }
    }

    onProgress?.(Math.min(i + BATCH_SIZE, rows.length), rows.length)
    // Yield to UI thread
    await new Promise(r => setTimeout(r, 0))
  }

  return { imported, updated, skipped, errors: errors.slice(0, 50) }
}

// ── Load module data from Dexie ───────────────────────────────────────

export async function loadModuleData(
  module: ExchangeModule,
  storeId: string,
  filters?: ExportFilters,
): Promise<Record<string, unknown>[]> {
  const { db } = await import('../db/dexie')
  const tableName = TABLE_MAP[module]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (db as any)[tableName]
  if (!table) return []

  let data: Record<string, unknown>[]
  try {
    data = await table.where('store_id').equals(storeId).toArray()
  } catch {
    data = await table.toArray()
  }

  // Apply filters
  if (filters) {
    if (filters.dateFrom) {
      data = data.filter((r: Record<string, unknown>) => String(r.created_at || '') >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      data = data.filter((r: Record<string, unknown>) => String(r.created_at || '') <= filters.dateTo! + 'T23:59:59')
    }
    if (filters.categories && filters.categories.length > 0) {
      data = data.filter((r: Record<string, unknown>) => filters.categories!.includes(String(r.category || '')))
    }
    if (filters.isActive !== undefined) {
      data = data.filter((r: Record<string, unknown>) => r.is_active === filters.isActive)
    }
    if (filters.status) {
      data = data.filter((r: Record<string, unknown>) => r.status === filters.status)
    }
  }

  return data
}

// ── Module metadata for UI ────────────────────────────────────────────

export const MODULE_LIST: { key: ExchangeModule; icon: string; defaultLabel: string }[] = [
  { key: 'products', icon: 'Package', defaultLabel: 'Products' },
  { key: 'customers', icon: 'Users', defaultLabel: 'Customers' },
  { key: 'suppliers', icon: 'Truck', defaultLabel: 'Suppliers' },
  { key: 'orders', icon: 'ClipboardList', defaultLabel: 'Orders' },
  { key: 'employees', icon: 'UserCheck', defaultLabel: 'Employees' },
  { key: 'stock_moves', icon: 'ArrowUpDown', defaultLabel: 'Stock Movements' },
  { key: 'promotions', icon: 'Tag', defaultLabel: 'Promotions' },
  { key: 'expenses', icon: 'Wallet', defaultLabel: 'Expenses' },
]

export const FORMAT_LIST: { key: ExchangeFormat; label: string; ext: string; mime: string }[] = [
  { key: 'csv', label: 'CSV', ext: '.csv', mime: 'text/csv' },
  { key: 'json', label: 'JSON', ext: '.json', mime: 'application/json' },
  { key: 'xlsx', label: 'Excel (XLSX)', ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { key: 'xml', label: 'XML', ext: '.xml', mime: 'application/xml' },
]

export function getAcceptString(format: ExchangeFormat): string {
  switch (format) {
    case 'csv': return '.csv,text/csv'
    case 'json': return '.json,application/json'
    case 'xlsx': return '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'xml': return '.xml,application/xml'
  }
}
