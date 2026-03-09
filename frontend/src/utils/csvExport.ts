// ---------------------------------------------------------------------------
// POS Mano Verde SA -- CSV Export Utilities (BOM UTF-8 for Excel compat)
// ---------------------------------------------------------------------------

import type { Order, Product, Customer } from '../types'
import { formatCurrency } from './currency'

// BOM (Byte Order Mark) for UTF-8 — ensures Excel reads accented chars correctly
const BOM = '\uFEFF'

/** Escape a CSV field value (handle commas, quotes, newlines) */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return `"${value}"`
}

/** Build CSV string from headers + rows, add BOM for Excel */
function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSV).join(',')
  const dataLines = rows.map(row => row.map(escapeCSV).join(','))
  return BOM + [headerLine, ...dataLines].join('\n')
}

/** Download a string as a CSV file */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Orders Export ─────────────────────────────────────────────────────────

export function exportOrdersCSV(
  orders: Order[],
  currencyCode: string,
  filename?: string,
): void {
  const headers = [
    'Date',
    'Receipt #',
    'Order ID',
    'Items',
    'Quantity',
    'Total',
    'Payment Method',
    'Status',
    'Customer',
    'Tax Rate',
    'Tip',
  ]

  const rows = orders.map(o => {
    const totalQty = o.items.reduce((s, i) => s + i.qty, 0)
    return [
      o.created_at.slice(0, 19).replace('T', ' '),
      o.receipt_number || '',
      o.id,
      o.items.map(i => `${i.name} x${i.qty}`).join('; '),
      totalQty.toString(),
      formatCurrency(o.total, currencyCode),
      o.payment_method,
      o.status,
      o.customer_name || '',
      '',
      o.tip_amount ? formatCurrency(o.tip_amount, currencyCode) : '',
    ]
  })

  const csv = buildCSV(headers, rows)
  const name = filename || `orders_${new Date().toISOString().slice(0, 10)}.csv`
  downloadCSV(csv, name)
}

// ── Inventory Export ──────────────────────────────────────────────────────

export function exportInventoryCSV(
  products: Product[],
  currencyCode: string,
  filename?: string,
): void {
  const headers = [
    'Name',
    'Category',
    'SKU',
    'Price',
    'Cost',
    'Stock',
    'Min Stock',
    'Unit',
    'Active',
    'Stock Value (Cost)',
    'Stock Value (Retail)',
  ]

  const rows = products.map(p => [
    p.name,
    p.category,
    p.sku || '',
    formatCurrency(p.price, currencyCode),
    p.cost ? formatCurrency(p.cost, currencyCode) : '',
    p.stock.toString(),
    (p.min_stock ?? 5).toString(),
    p.unit || '',
    p.is_active ? 'Yes' : 'No',
    p.cost ? formatCurrency(p.cost * Math.max(p.stock, 0), currencyCode) : '',
    formatCurrency(p.price * Math.max(p.stock, 0), currencyCode),
  ])

  const csv = buildCSV(headers, rows)
  const name = filename || `inventory_${new Date().toISOString().slice(0, 10)}.csv`
  downloadCSV(csv, name)
}

// ── Customers Export ──────────────────────────────────────────────────────

export function exportCustomersCSV(
  customers: Customer[],
  filename?: string,
): void {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Address',
    'Loyalty Points',
    'Total Purchases',
    'Notes',
    'Created',
  ]

  const rows = customers.map(c => [
    c.name,
    c.email || '',
    c.phone || '',
    c.address || '',
    (c.loyalty_points ?? 0).toString(),
    c.total_spent.toString(),
    c.notes || '',
    c.created_at?.slice(0, 10) || '',
  ])

  const csv = buildCSV(headers, rows)
  const name = filename || `customers_${new Date().toISOString().slice(0, 10)}.csv`
  downloadCSV(csv, name)
}

// ── Generic CSV export ───────────────────────────────────────────────────

export function exportToCSV(
  headers: string[],
  rows: string[][],
  filename: string,
): void {
  const csv = buildCSV(headers, rows)
  downloadCSV(csv, filename)
}
