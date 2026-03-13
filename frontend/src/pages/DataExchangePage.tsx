/**
 * DataExchangePage — Cross-cutting Import/Export for all modules.
 * 3 tabs: Export, Import, Templates.
 * Activity-aware schemas, supports CSV/JSON/XLSX/XML.
 */
import { useState, useMemo, useCallback, useRef } from 'react'
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  FileText,
  FileCode,
  Package,
  Users,
  Truck,
  ClipboardList,
  UserCheck,
  ArrowUpDown,
  Tag,
  Wallet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  UploadCloud,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { Activity } from '../types'
import {
  MODULE_LIST,
  FORMAT_LIST,
  getAcceptString,
  getModuleFields,
  loadModuleData,
  exportData,
  parseFile,
  validateImportData,
  executeImport,
  downloadTemplate,
  type ExchangeFormat,
  type ExchangeModule,
  type ImportValidation,
  type ImportResult,
  type ExportFilters,
} from '../utils/dataExchange'

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  purple: '#7c3aed',
}

const MODULE_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  Package, Users, Truck, ClipboardList, UserCheck, ArrowUpDown, Tag, Wallet,
}

const FORMAT_ICONS: Record<ExchangeFormat, React.FC<{ size?: number; color?: string }>> = {
  csv: FileText,
  json: FileJson,
  xlsx: FileSpreadsheet,
  xml: FileCode,
}

type Tab = 'export' | 'import' | 'templates'
type ImportStep = 'upload' | 'preview' | 'confirm' | 'result'

export default function DataExchangePage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { rv } = useResponsive()

  const storeId = currentStore?.id || ''
  const activity = (currentStore?.activity || 'restaurant') as Activity

  const [activeTab, setActiveTab] = useState<Tab>('export')

  // ── i18n with fallback ────────────────────────────────────────
  const tr = useMemo(() => {
    const w = (t as unknown as Record<string, any>).dataExchange || {}
    return {
      title: w.title || 'Data Exchange',
      subtitle: w.subtitle || 'Import and export data across all modules',
      exportTab: w.exportTab || 'Export',
      importTab: w.importTab || 'Import',
      templatesTab: w.templatesTab || 'Templates',
      // Module names
      products: w.products || 'Products',
      orders: w.orders || 'Orders',
      customers: w.customers || 'Customers',
      suppliers: w.suppliers || 'Suppliers',
      employees: w.employees || 'Employees',
      stockMoves: w.stockMoves || 'Stock Movements',
      promotions: w.promotions || 'Promotions',
      expenses: w.expenses || 'Expenses',
      // Formats
      formatCSV: w.formatCSV || 'CSV',
      formatJSON: w.formatJSON || 'JSON',
      formatXLSX: w.formatXLSX || 'Excel (XLSX)',
      formatXML: w.formatXML || 'XML',
      // Export
      selectModule: w.selectModule || 'Select Module',
      selectFormat: w.selectFormat || 'Select Format',
      exportBtn: w.exportBtn || 'Export',
      exportCount: w.exportCount || 'records to export',
      exporting: w.exporting || 'Exporting...',
      exportSuccess: w.exportSuccess || 'Export completed successfully',
      noData: w.noData || 'No data to export',
      filters: w.filters || 'Filters',
      dateFrom: w.dateFrom || 'From',
      dateTo: w.dateTo || 'To',
      category: w.category || 'Category',
      activeOnly: w.activeOnly || 'Active only',
      // Import
      uploadFile: w.uploadFile || 'Upload File',
      dragDrop: w.dragDrop || 'Drag and drop a file here, or click to browse',
      preview: w.preview || 'Preview',
      validate: w.validate || 'Validate',
      confirm: w.confirm || 'Confirm Import',
      result: w.result || 'Result',
      importMode: w.importMode || 'Import Mode',
      insertMode: w.insertMode || 'Insert (new records only)',
      upsertMode: w.upsertMode || 'Upsert (update if exists)',
      validRows: w.validRows || 'valid rows',
      errorRows: w.errorRows || 'errors',
      warningCount: w.warningCount || 'warnings',
      importing: w.importing || 'Importing...',
      importSuccess: w.importSuccess || 'Import completed',
      imported: w.imported || 'imported',
      updated: w.updated || 'updated',
      skipped: w.skipped || 'skipped',
      errors: w.errors || 'errors',
      back: w.back || 'Back',
      startOver: w.startOver || 'Start Over',
      row: w.row || 'Row',
      field: w.field || 'Field',
      message: w.message || 'Message',
      value: w.value || 'Value',
      // Templates
      downloadTemplate: w.downloadTemplate || 'Download Template',
      baseFields: w.baseFields || 'Base fields',
      activityFields: w.activityFields || 'Activity-specific fields',
      sampleData: w.sampleData || 'Includes 3 sample rows',
      required: w.required || 'required',
    }
  }, [t])

  const moduleLabel = useCallback((key: ExchangeModule): string => {
    const map: Record<ExchangeModule, string> = {
      products: tr.products, orders: tr.orders, customers: tr.customers,
      suppliers: tr.suppliers, employees: tr.employees,
      stock_moves: tr.stockMoves, promotions: tr.promotions, expenses: tr.expenses,
    }
    return map[key] || key
  }, [tr])

  // ── Export state ──────────────────────────────────────────────
  const [expModule, setExpModule] = useState<ExchangeModule>('products')
  const [expFormat, setExpFormat] = useState<ExchangeFormat>('csv')
  const [expCount, setExpCount] = useState<number | null>(null)
  const [expLoading, setExpLoading] = useState(false)
  const [expMsg, setExpMsg] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [expFilters, setExpFilters] = useState<ExportFilters>({})

  // ── Import state ──────────────────────────────────────────────
  const [impModule, setImpModule] = useState<ExchangeModule>('products')
  const [impFormat, setImpFormat] = useState<ExchangeFormat>('csv')
  const [impStep, setImpStep] = useState<ImportStep>('upload')
  // impFile not stored - we extract headers/rows immediately
  const [impHeaders, setImpHeaders] = useState<string[]>([])
  const [impRows, setImpRows] = useState<string[][]>([])
  const [impValidation, setImpValidation] = useState<ImportValidation | null>(null)
  const [impMode, setImpMode] = useState<'insert' | 'upsert'>('insert')
  const [impLoading, setImpLoading] = useState(false)
  const [impProgress, setImpProgress] = useState(0)
  const [impResult, setImpResult] = useState<ImportResult | null>(null)
  const [impError, setImpError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Export handlers ───────────────────────────────────────────

  const countExportData = useCallback(async () => {
    if (!storeId) return
    try {
      const data = await loadModuleData(expModule, storeId, expFilters)
      setExpCount(data.length)
    } catch { setExpCount(0) }
  }, [storeId, expModule, expFilters])

  const handleExport = async () => {
    if (!storeId) return
    setExpLoading(true)
    setExpMsg(null)
    try {
      const data = await loadModuleData(expModule, storeId, expFilters)
      if (data.length === 0) {
        setExpMsg(tr.noData)
        return
      }
      await exportData(expModule, expFormat, data, activity, currentStore?.name)
      setExpMsg(`${tr.exportSuccess} (${data.length} ${tr.exportCount})`)
    } catch (err) {
      setExpMsg(`Error: ${(err as Error).message}`)
    } finally {
      setExpLoading(false)
    }
  }

  // Auto-count on module/filter change
  useMemo(() => { countExportData() }, [countExportData])

  // ── Import handlers ───────────────────────────────────────────

  const handleFileSelect = async (file: File) => {
    setImpLoading(true)
    setImpError(null)
    try {
      const { headers, rows } = await parseFile(file, impFormat)
      setImpHeaders(headers)
      setImpRows(rows)
      const validation = validateImportData(headers, rows, impModule, activity)
      setImpValidation(validation)
      setImpStep('preview')
    } catch (err) {
      setImpError(`Parse error: ${(err as Error).message}`)
    } finally {
      setImpLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleImport = async () => {
    if (!storeId || impRows.length === 0) return
    setImpLoading(true)
    setImpStep('confirm')
    try {
      const result = await executeImport(
        impModule, impHeaders, impRows, storeId, activity, impMode,
        (done, total) => setImpProgress(Math.round((done / total) * 100))
      )
      setImpResult(result)
      setImpStep('result')
    } catch (err) {
      setImpError(`Import error: ${(err as Error).message}`)
      setImpStep('result')
    } finally {
      setImpLoading(false)
    }
  }

  const resetImport = () => {
    setImpStep('upload')
    setImpHeaders([])
    setImpRows([])
    setImpValidation(null)
    setImpResult(null)
    setImpError(null)
    setImpProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Styles ────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(16, 24, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: rv(16, 20, 24),
  }

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 0,
    borderBottom: `2px solid ${C.border}`,
    marginBottom: rv(16, 20, 24),
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: rv('8px 12px', '10px 20px', '10px 24px'),
    border: 'none',
    borderBottom: active ? `2px solid ${C.primary}` : '2px solid transparent',
    background: 'none',
    color: active ? C.primary : C.textSecondary,
    fontWeight: active ? 600 : 400,
    fontSize: rv(13, 14, 14),
    cursor: 'pointer',
    marginBottom: -2,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  })

  const cardStyle: React.CSSProperties = {
    background: C.card,
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    padding: rv(14, 18, 20),
    marginBottom: 16,
  }

  const btnStyle = (color: string, outline?: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: outline ? `1px solid ${color}` : 'none',
    background: outline ? 'transparent' : color,
    color: outline ? color : '#fff',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  })

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.card,
    color: C.text,
    fontSize: 13,
    minWidth: 160,
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.card,
    color: C.text,
    fontSize: 13,
  }

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 12,
    background: `${color}15`,
    color,
    fontSize: 12,
    fontWeight: 600,
  })

  const formatBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 8,
    border: `1px solid ${active ? C.primary : C.border}`,
    background: active ? `${C.primary}10` : C.card,
    color: active ? C.primary : C.textSecondary,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  })

  // ── Export Tab ────────────────────────────────────────────────

  const renderExport = () => (
    <div>
      <div style={cardStyle}>
        {/* Module selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6 }}>
            {tr.selectModule}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MODULE_LIST.map(m => {
              const Icon = MODULE_ICONS[m.icon]
              const active = expModule === m.key
              return (
                <button
                  key={m.key}
                  onClick={() => { setExpModule(m.key); setExpMsg(null) }}
                  style={{
                    ...formatBtnStyle(active),
                    padding: '8px 14px',
                  }}
                >
                  {Icon && <Icon size={16} />}
                  {moduleLabel(m.key)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Format selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6 }}>
            {tr.selectFormat}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {FORMAT_LIST.map(f => {
              const Icon = FORMAT_ICONS[f.key]
              return (
                <button
                  key={f.key}
                  onClick={() => setExpFormat(f.key)}
                  style={formatBtnStyle(expFormat === f.key)}
                >
                  <Icon size={16} />
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filters toggle */}
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ ...btnStyle(C.textSecondary, true), fontSize: 12, padding: '6px 12px' }}
          >
            <Filter size={14} />
            {tr.filters}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showFilters && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12,
            background: C.bg, borderRadius: 8, marginBottom: 12,
          }}>
            <div>
              <label style={{ fontSize: 11, color: C.textSecondary, display: 'block', marginBottom: 2 }}>{tr.dateFrom}</label>
              <input
                type="date"
                value={expFilters.dateFrom || ''}
                onChange={e => setExpFilters(f => ({ ...f, dateFrom: e.target.value || undefined }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textSecondary, display: 'block', marginBottom: 2 }}>{tr.dateTo}</label>
              <input
                type="date"
                value={expFilters.dateTo || ''}
                onChange={e => setExpFilters(f => ({ ...f, dateTo: e.target.value || undefined }))}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={expFilters.isActive === true}
                  onChange={e => setExpFilters(f => ({ ...f, isActive: e.target.checked ? true : undefined }))}
                />
                {tr.activeOnly}
              </label>
            </div>
          </div>
        )}

        {/* Export button + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleExport}
            disabled={expLoading}
            style={{ ...btnStyle(C.primary), opacity: expLoading ? 0.6 : 1 }}
          >
            {expLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
            {expLoading ? tr.exporting : tr.exportBtn}
          </button>
          {expCount !== null && (
            <span style={badgeStyle(C.primary)}>
              {expCount} {tr.exportCount}
            </span>
          )}
          <button onClick={countExportData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textSecondary }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {expMsg && (
          <div style={{
            marginTop: 12, padding: '8px 12px', borderRadius: 8,
            background: expMsg.startsWith('Error') ? `${C.danger}10` : `${C.success}10`,
            color: expMsg.startsWith('Error') ? C.danger : C.success,
            fontSize: 13,
          }}>
            {expMsg}
          </div>
        )}
      </div>
    </div>
  )

  // ── Import Tab ────────────────────────────────────────────────

  const renderImportUpload = () => (
    <div style={cardStyle}>
      {/* Module + Format selectors */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 4 }}>
            {tr.selectModule}
          </label>
          <select value={impModule} onChange={e => setImpModule(e.target.value as ExchangeModule)} style={selectStyle}>
            {MODULE_LIST.map(m => <option key={m.key} value={m.key}>{moduleLabel(m.key)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 4 }}>
            {tr.selectFormat}
          </label>
          <select value={impFormat} onChange={e => setImpFormat(e.target.value as ExchangeFormat)} style={selectStyle}>
            {FORMAT_LIST.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${C.border}`,
          borderRadius: 12,
          padding: rv('24px 16px', '40px 24px', '48px 24px'),
          textAlign: 'center',
          cursor: 'pointer',
          background: `${C.primary}05`,
          transition: 'border-color 0.2s',
        }}
      >
        <UploadCloud size={40} color={C.primary} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{tr.dragDrop}</div>
        <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
          {FORMAT_LIST.find(f => f.key === impFormat)?.label} ({FORMAT_LIST.find(f => f.key === impFormat)?.ext})
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString(impFormat)}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {impLoading && (
        <div style={{ textAlign: 'center', padding: 16, color: C.primary }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {impError && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 8,
          background: `${C.danger}10`, color: C.danger, fontSize: 13,
        }}>
          <AlertTriangle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {impError}
        </div>
      )}
    </div>
  )

  const renderImportPreview = () => {
    if (!impValidation) return null
    const v = impValidation
    return (
      <div>
        <div style={cardStyle}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={badgeStyle(C.primary)}>{v.totalRows} {tr.row}s</span>
            <span style={badgeStyle(C.success)}>
              <CheckCircle size={12} /> {v.validRows} {tr.validRows}
            </span>
            {v.errors.length > 0 && (
              <span style={badgeStyle(C.danger)}>
                <XCircle size={12} /> {v.errors.length} {tr.errorRows}
              </span>
            )}
            {v.warnings.length > 0 && (
              <span style={badgeStyle(C.warning)}>
                <AlertTriangle size={12} /> {v.warnings.length} {tr.warningCount}
              </span>
            )}
          </div>

          {/* Warnings */}
          {v.warnings.length > 0 && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 12,
              background: `${C.warning}10`, color: C.warning, fontSize: 12,
            }}>
              {v.warnings.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          )}

          {/* Preview table */}
          {v.preview.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {Object.keys(v.preview[0]).map(k => (
                      <th key={k} style={{
                        padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${C.border}`,
                        color: C.textSecondary, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {v.preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} style={{
                          padding: '6px 10px', borderBottom: `1px solid ${C.border}`,
                          maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Errors table */}
          {v.errors.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.danger, marginBottom: 6 }}>
                {tr.errors} ({v.errors.length})
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${C.border}`, color: C.textSecondary }}>{tr.row}</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${C.border}`, color: C.textSecondary }}>{tr.field}</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${C.border}`, color: C.textSecondary }}>{tr.message}</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', borderBottom: `2px solid ${C.border}`, color: C.textSecondary }}>{tr.value}</th>
                  </tr>
                </thead>
                <tbody>
                  {v.errors.slice(0, 20).map((err, i) => (
                    <tr key={i}>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${C.border}` }}>{err.row}</td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${C.border}` }}>{err.field}</td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${C.border}`, color: C.danger }}>{err.message}</td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${C.border}`, color: C.textSecondary }}>
                        {err.value?.slice(0, 30)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Import mode */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 4 }}>
              {tr.importMode}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setImpMode('insert')}
                style={formatBtnStyle(impMode === 'insert')}
              >
                {tr.insertMode}
              </button>
              <button
                onClick={() => setImpMode('upsert')}
                style={formatBtnStyle(impMode === 'upsert')}
              >
                {tr.upsertMode}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resetImport} style={btnStyle(C.textSecondary, true)}>
              {tr.back}
            </button>
            <button
              onClick={handleImport}
              disabled={!v.valid && v.validRows === 0}
              style={{
                ...btnStyle(C.success),
                opacity: (!v.valid && v.validRows === 0) ? 0.5 : 1,
              }}
            >
              <Upload size={16} />
              {tr.confirm} ({v.validRows} {tr.validRows})
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderImportConfirm = () => (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{tr.importing}</div>
        <div style={{
          marginTop: 12, height: 6, background: C.border, borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: C.primary, borderRadius: 3,
            width: `${impProgress}%`, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 6 }}>{impProgress}%</div>
      </div>
    </div>
  )

  const renderImportResult = () => (
    <div style={cardStyle}>
      {impResult ? (
        <div>
          <div style={{
            textAlign: 'center', padding: 16, marginBottom: 16,
            color: impResult.errors.length === 0 ? C.success : C.warning,
          }}>
            {impResult.errors.length === 0
              ? <CheckCircle size={40} style={{ margin: '0 auto 8px' }} />
              : <AlertTriangle size={40} style={{ margin: '0 auto 8px' }} />
            }
            <div style={{ fontSize: 16, fontWeight: 600 }}>{tr.importSuccess}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={badgeStyle(C.success)}>
              <CheckCircle size={12} /> {impResult.imported} {tr.imported}
            </span>
            {impResult.updated > 0 && (
              <span style={badgeStyle(C.primary)}>
                <RefreshCw size={12} /> {impResult.updated} {tr.updated}
              </span>
            )}
            {impResult.skipped > 0 && (
              <span style={badgeStyle(C.warning)}>
                <AlertTriangle size={12} /> {impResult.skipped} {tr.skipped}
              </span>
            )}
          </div>

          {impResult.errors.length > 0 && (
            <div style={{
              padding: '8px 12px', borderRadius: 8, marginBottom: 16,
              background: `${C.danger}10`, color: C.danger, fontSize: 12, maxHeight: 200, overflowY: 'auto',
            }}>
              {impResult.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <button onClick={resetImport} style={btnStyle(C.primary)}>
              {tr.startOver}
            </button>
          </div>
        </div>
      ) : impError ? (
        <div style={{ textAlign: 'center', padding: 16, color: C.danger }}>
          <XCircle size={40} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, marginBottom: 16 }}>{impError}</div>
          <button onClick={resetImport} style={btnStyle(C.primary)}>
            {tr.startOver}
          </button>
        </div>
      ) : null}
    </div>
  )

  const renderImport = () => (
    <div>
      {/* Step indicator */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 16, alignItems: 'center',
      }}>
        {(['upload', 'preview', 'confirm', 'result'] as ImportStep[]).map((step, i) => {
          const labels = [tr.uploadFile, tr.preview, tr.confirm, tr.result]
          const isActive = step === impStep
          const isDone = ['upload', 'preview', 'confirm', 'result'].indexOf(impStep) > i
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <div style={{ width: rv(12, 24, 32), height: 2, background: isDone || isActive ? C.primary : C.border }} />}
              <div style={{
                padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: isActive ? 600 : 400,
                background: isActive ? `${C.primary}15` : isDone ? `${C.success}15` : C.bg,
                color: isActive ? C.primary : isDone ? C.success : C.textSecondary,
              }}>
                {isDone && <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                {labels[i]}
              </div>
            </div>
          )
        })}
      </div>

      {impStep === 'upload' && renderImportUpload()}
      {impStep === 'preview' && renderImportPreview()}
      {impStep === 'confirm' && renderImportConfirm()}
      {impStep === 'result' && renderImportResult()}
    </div>
  )

  // ── Templates Tab ─────────────────────────────────────────────

  const renderTemplates = () => {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr 1fr'),
        gap: 16,
      }}>
        {MODULE_LIST.map(m => {
          const Icon = MODULE_ICONS[m.icon]
          const fields = getModuleFields(m.key, activity)
          const baseFields = fields.filter(f => !f.activitySpecific)
          const actFields = fields.filter(f => f.activitySpecific)

          return (
            <div key={m.key} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {Icon && <Icon size={20} color={C.primary} />}
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{moduleLabel(m.key)}</span>
              </div>

              {/* Base fields */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>
                  {tr.baseFields} ({baseFields.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {baseFields.map(f => (
                    <span key={f.key} style={{
                      fontSize: 11, padding: '2px 6px', borderRadius: 4,
                      background: f.required ? `${C.primary}12` : C.bg,
                      color: f.required ? C.primary : C.textSecondary,
                    }}>
                      {f.label}{f.required ? '*' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Activity fields */}
              {actFields.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.purple, marginBottom: 4 }}>
                    {tr.activityFields} ({actFields.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {actFields.map(f => (
                      <span key={f.key} style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: `${C.purple}12`, color: C.purple,
                      }}>
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 10 }}>
                {tr.sampleData}
              </div>

              {/* Download buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FORMAT_LIST.map(f => {
                  const FmtIcon = FORMAT_ICONS[f.key]
                  return (
                    <button
                      key={f.key}
                      onClick={() => downloadTemplate(m.key, f.key, activity)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        background: C.card,
                        color: C.text,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <FmtIcon size={12} />
                      {f.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* CSS animation for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: rv(18, 22, 24), color: C.text }}>{tr.title}</h2>
        <p style={{ margin: '4px 0 0', fontSize: rv(12, 13, 14), color: C.textSecondary }}>{tr.subtitle}</p>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        <button onClick={() => setActiveTab('export')} style={tabStyle(activeTab === 'export')}>
          <Download size={16} /> {tr.exportTab}
        </button>
        <button onClick={() => setActiveTab('import')} style={tabStyle(activeTab === 'import')}>
          <Upload size={16} /> {tr.importTab}
        </button>
        <button onClick={() => setActiveTab('templates')} style={tabStyle(activeTab === 'templates')}>
          <FileSpreadsheet size={16} /> {tr.templatesTab}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'export' && renderExport()}
      {activeTab === 'import' && renderImport()}
      {activeTab === 'templates' && renderTemplates()}
    </div>
  )
}
