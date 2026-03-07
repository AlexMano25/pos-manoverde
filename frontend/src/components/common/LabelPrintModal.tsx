import { useState } from 'react'
import { X, Printer, FileText } from 'lucide-react'
import type { Product } from '../../types'
import { useLanguageStore } from '../../stores/languageStore'
import { exportPriceLabels } from '../../utils/pdfExport'

// ── Types ────────────────────────────────────────────────────────────────

interface LabelPrintModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  storeName: string
  currencyCode?: string
  onAutoGenerateBarcodes?: (productIds: string[]) => Promise<void>
}

// ── Presets ──────────────────────────────────────────────────────────────

const LABEL_PRESETS = [
  { label: '50 × 30 mm', width: 50, height: 30 },
  { label: '60 × 40 mm', width: 60, height: 40 },
  { label: '70 × 40 mm', width: 70, height: 40 },
]

// ── Component ────────────────────────────────────────────────────────────

export default function LabelPrintModal({
  isOpen,
  onClose,
  products,
  storeName,
  currencyCode = 'XAF',
  onAutoGenerateBarcodes,
}: LabelPrintModalProps) {
  const { t } = useLanguageStore()
  const [presetIndex, setPresetIndex] = useState(1) // 60×40 default
  const [columns, setColumns] = useState(3)
  const [showCategory, setShowCategory] = useState(false)
  const [showSku, setShowSku] = useState(false)
  const [autoBarcode, setAutoBarcode] = useState(true)
  const [generating, setGenerating] = useState(false)

  if (!isOpen) return null

  const productsWithoutBarcode = products.filter(p => !p.barcode)
  const preset = LABEL_PRESETS[presetIndex]

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // Auto-generate barcodes if requested
      if (autoBarcode && productsWithoutBarcode.length > 0 && onAutoGenerateBarcodes) {
        await onAutoGenerateBarcodes(productsWithoutBarcode.map(p => p.id))
        // Small delay to let state propagate
        await new Promise(r => setTimeout(r, 200))
      }

      exportPriceLabels(products, storeName, {
        labelWidth: preset.width,
        labelHeight: preset.height,
        columns,
        showCategory,
        showSku,
        currencyCode,
      })
    } catch (err) {
      console.error('Label generation failed:', err)
    }
    setGenerating(false)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, backgroundColor: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Printer size={20} color="#2563eb" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {t.products.printLabels}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                {products.length} {t.products.labelsCount}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, display: 'flex', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Label size */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>
              {t.products.labelSize}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {LABEL_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPresetIndex(idx)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: presetIndex === idx ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: presetIndex === idx ? '#eff6ff' : '#fff',
                    color: presetIndex === idx ? '#2563eb' : '#475569',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>
              {t.products.columnsPerRow}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setColumns(n)}
                  style={{
                    width: 48, height: 36, borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: columns === n ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: columns === n ? '#eff6ff' : '#fff',
                    color: columns === n ? '#2563eb' : '#475569',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={showCategory} onChange={e => setShowCategory(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
              <span style={{ fontSize: 13, color: '#334155' }}>{t.products.showCategory}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={showSku} onChange={e => setShowSku(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
              <span style={{ fontSize: 13, color: '#334155' }}>{t.products.showSku}</span>
            </label>
            {productsWithoutBarcode.length > 0 && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={autoBarcode} onChange={e => setAutoBarcode(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#f59e0b' }} />
                <span style={{ fontSize: 13, color: '#334155' }}>
                  {t.products.autoGenerateBarcode}
                  <span style={{ color: '#f59e0b', fontWeight: 600, marginLeft: 4 }}>
                    ({productsWithoutBarcode.length})
                  </span>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0',
              backgroundColor: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              backgroundColor: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: generating ? 'wait' : 'pointer', opacity: generating ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.2s',
            }}
          >
            <FileText size={16} />
            {t.products.generateLabels}
          </button>
        </div>
      </div>
    </div>
  )
}
