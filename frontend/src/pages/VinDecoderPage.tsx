import { useState, useCallback } from 'react'
import {
  Search,
  Loader2,
  Car,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Copy,
  Hash,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useVehicleStore } from '../stores/vehicleStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { VinDecodeResult } from '../types'

// ── Color palette ────────────────────────────────────────────────────────

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
} as const

// ── VIN validation ───────────────────────────────────────────────────────

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i
const INVALID_CHARS = /[IOQ]/i

function validateVin(vin: string): { valid: boolean; error?: string } {
  const trimmed = vin.trim().toUpperCase()
  if (trimmed.length === 0) return { valid: false, error: 'VIN is required' }
  if (trimmed.length !== 17) return { valid: false, error: `VIN must be 17 characters (currently ${trimmed.length})` }
  if (INVALID_CHARS.test(trimmed)) return { valid: false, error: 'VIN cannot contain letters I, O, or Q' }
  if (!VIN_REGEX.test(trimmed)) return { valid: false, error: 'VIN must contain only letters (A-H, J-N, P, R-Z) and digits' }
  return { valid: true }
}

// ── Recent lookup type ───────────────────────────────────────────────────

interface RecentLookup {
  vin: string
  make: string
  model: string
  year: number
  timestamp: string
}

// ── Result field config ──────────────────────────────────────────────────

const RESULT_FIELDS: { key: keyof VinDecodeResult; label: string; fallback: string }[] = [
  { key: 'make', label: 'Make', fallback: 'Marque' },
  { key: 'model', label: 'Model', fallback: 'Modele' },
  { key: 'year', label: 'Year', fallback: 'Annee' },
  { key: 'body_class', label: 'Body Class', fallback: 'Carrosserie' },
  { key: 'engine_info', label: 'Engine', fallback: 'Moteur' },
  { key: 'drive_type', label: 'Drive Type', fallback: 'Transmission' },
  { key: 'fuel_type', label: 'Fuel Type', fallback: 'Carburant' },
  { key: 'manufacturer', label: 'Manufacturer', fallback: 'Constructeur' },
  { key: 'plant_country', label: 'Plant Country', fallback: 'Pays de fabrication' },
  { key: 'vehicle_type', label: 'Vehicle Type', fallback: 'Type de vehicule' },
]

// ── Component ────────────────────────────────────────────────────────────

export default function VinDecoderPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const { vinResult, vinLoading, decodeVin, clearVinResult, createVehicle } = useVehicleStore()

  const [vinInput, setVinInput] = useState('')
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true })
  const [recentLookups, setRecentLookups] = useState<RecentLookup[]>([])
  const [addedToGarage, setAddedToGarage] = useState(false)
  const [addingToGarage, setAddingToGarage] = useState(false)
  const [copiedVin, setCopiedVin] = useState(false)

  const storeId = currentStore?.id || ''

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleVinChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17)
    setVinInput(upper)
    setAddedToGarage(false)
    if (upper.length > 0) {
      setValidation(validateVin(upper))
    } else {
      setValidation({ valid: true })
    }
  }

  const handleDecode = useCallback(async () => {
    const check = validateVin(vinInput)
    setValidation(check)
    if (!check.valid) return

    clearVinResult()
    setAddedToGarage(false)

    const result = await decodeVin(vinInput.trim().toUpperCase())

    if (!result.error && result.make) {
      setRecentLookups(prev => {
        const filtered = prev.filter(l => l.vin !== result.vin)
        const updated = [
          { vin: result.vin, make: result.make, model: result.model, year: result.year, timestamp: new Date().toISOString() },
          ...filtered,
        ]
        return updated.slice(0, 10)
      })
    }
  }, [vinInput, decodeVin, clearVinResult])

  const handleAddToGarage = async () => {
    if (!vinResult || !storeId || vinResult.error) return
    setAddingToGarage(true)
    try {
      await createVehicle({
        store_id: storeId,
        vin: vinResult.vin,
        make: vinResult.make,
        model: vinResult.model,
        year: vinResult.year || undefined,
        engine_type: vinResult.engine_info || undefined,
      })
      setAddedToGarage(true)
    } catch (err) {
      console.error('[VinDecoderPage] Failed to add vehicle:', err)
    } finally {
      setAddingToGarage(false)
    }
  }

  const handleRecentClick = (lookup: RecentLookup) => {
    setVinInput(lookup.vin)
    setValidation({ valid: true })
    setAddedToGarage(false)
  }

  const handleCopyVin = async (vin: string) => {
    try {
      await navigator.clipboard.writeText(vin)
      setCopiedVin(true)
      setTimeout(() => setCopiedVin(false), 2000)
    } catch { /* ignore */ }
  }

  const handleClearRecent = () => setRecentLookups([])

  // ── Render helpers ───────────────────────────────────────────────────

  const vinLength = vinInput.length

  return (
    <div style={{ padding: rv(16, 24, 32), backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: rv(20, 28, 32) }}>
        <h1 style={{ margin: 0, fontSize: rv(22, 26, 28), fontWeight: 800, color: C.text }}>
          {(t as any).garage?.vinDecoder || 'VIN Decoder'}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: C.textSecondary }}>
          {(t as any).garage?.vinDecoderDesc || 'Decode a Vehicle Identification Number to get vehicle details'}
        </p>
      </div>

      {/* ── VIN Input Card ────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card,
        borderRadius: 12,
        padding: rv(16, 24, 28),
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        marginBottom: 24,
        border: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Hash size={20} color={C.primary} />
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            {(t as any).garage?.enterVin || 'Enter VIN'}
          </span>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
          alignItems: isMobile ? 'stretch' : 'flex-start',
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={vinInput}
              onChange={e => handleVinChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && validation.valid && vinLength === 17) handleDecode() }}
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 16,
                fontFamily: 'monospace',
                letterSpacing: 2,
                border: `2px solid ${!validation.valid && vinLength > 0 ? C.danger : vinLength === 17 && validation.valid ? C.success : C.border}`,
                borderRadius: 10,
                outline: 'none',
                color: C.text,
                backgroundColor: C.bg,
                textTransform: 'uppercase',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
            <div style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 12,
              color: vinLength === 17 ? C.success : C.textSecondary,
              fontWeight: 600,
            }}>
              {vinLength}/17
            </div>
          </div>

          <button
            onClick={handleDecode}
            disabled={vinLoading || !validation.valid || vinLength !== 17}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 24px',
              backgroundColor: vinLoading || !validation.valid || vinLength !== 17 ? '#93c5fd' : C.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: vinLoading || !validation.valid || vinLength !== 17 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              minWidth: 140,
              transition: 'background-color 0.2s',
            }}
          >
            {vinLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={18} />}
            {vinLoading
              ? ((t as any).garage?.decoding || 'Decoding...')
              : ((t as any).garage?.decode || 'Decode')
            }
          </button>
        </div>

        {/* Validation error */}
        {!validation.valid && vinLength > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            padding: '8px 12px',
            backgroundColor: '#fef2f2',
            borderRadius: 8,
            color: C.danger,
            fontSize: 13,
            fontWeight: 500,
          }}>
            <AlertTriangle size={14} />
            {validation.error}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: 24,
      }}>
        {/* ── Decode Results ─────────────────────────────────────────────── */}
        <div>
          {vinLoading && (
            <div style={{
              backgroundColor: C.card,
              borderRadius: 12,
              padding: 48,
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}>
              <Loader2 size={36} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 15, color: C.textSecondary, fontWeight: 500 }}>
                {(t as any).garage?.decodingVin || 'Decoding VIN...'}
              </span>
            </div>
          )}

          {vinResult && !vinLoading && (
            <div style={{
              backgroundColor: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}>
              {/* Result header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: vinResult.error ? '#fef2f2' : '#f0fdf4',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {vinResult.error
                    ? <AlertTriangle size={20} color={C.danger} />
                    : <CheckCircle size={20} color={C.success} />
                  }
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {vinResult.error
                      ? ((t as any).garage?.decodeError || 'Decode Error')
                      : `${vinResult.year || ''} ${vinResult.make} ${vinResult.model}`.trim()
                    }
                  </span>
                </div>
                <button
                  onClick={() => handleCopyVin(vinResult.vin)}
                  title="Copy VIN"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    color: C.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  <Copy size={13} />
                  {copiedVin ? ((t as any).garage?.copied || 'Copied!') : vinResult.vin}
                </button>
              </div>

              {/* Error message */}
              {vinResult.error && (
                <div style={{ padding: 20 }}>
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fef2f2',
                    borderRadius: 8,
                    color: C.danger,
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}>
                    {vinResult.error}
                  </div>
                </div>
              )}

              {/* Result fields */}
              {!vinResult.error && (
                <div style={{ padding: 20 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: rv('1fr', '1fr 1fr', '1fr 1fr'),
                    gap: 12,
                  }}>
                    {RESULT_FIELDS.map(field => {
                      const value = vinResult[field.key]
                      if (!value || value === 'Unknown' || value === 0) return null
                      return (
                        <div key={field.key} style={{
                          padding: '12px 16px',
                          backgroundColor: C.bg,
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                            {(t as any).garage?.[field.key] || field.fallback}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                            {String(value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add to garage button */}
                  <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleAddToGarage}
                      disabled={addingToGarage || addedToGarage || !storeId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        backgroundColor: addedToGarage ? C.success : addingToGarage ? '#93c5fd' : C.primary,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: addedToGarage || addingToGarage ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {addingToGarage
                        ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        : addedToGarage
                          ? <CheckCircle size={18} />
                          : <Plus size={18} />
                      }
                      {addedToGarage
                        ? ((t as any).garage?.addedToGarage || 'Added to Garage')
                        : ((t as any).garage?.addToGarage || 'Add to Garage')
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state when no result */}
          {!vinResult && !vinLoading && (
            <div style={{
              backgroundColor: C.card,
              borderRadius: 12,
              padding: 48,
              border: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              textAlign: 'center',
            }}>
              <Car size={48} color={C.border} strokeWidth={1.5} />
              <span style={{ fontSize: 16, fontWeight: 600, color: C.textSecondary }}>
                {(t as any).garage?.enterVinPrompt || 'Enter a 17-character VIN to decode vehicle information'}
              </span>
              <span style={{ fontSize: 13, color: C.textSecondary }}>
                {(t as any).garage?.vinInfo || 'Uses the NHTSA Vehicle API for US/International vehicles'}
              </span>
            </div>
          )}
        </div>

        {/* ── Recent Lookups ─────────────────────────────────────────────── */}
        <div>
          <div style={{
            backgroundColor: C.card,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color={C.primary} />
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  {(t as any).garage?.recentLookups || 'Recent Lookups'}
                </span>
              </div>
              {recentLookups.length > 0 && (
                <button
                  onClick={handleClearRecent}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: C.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  <Trash2 size={12} />
                  {(t as any).common?.clear || 'Clear'}
                </button>
              )}
            </div>

            <div style={{ padding: recentLookups.length === 0 ? 20 : 0 }}>
              {recentLookups.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 24,
                  color: C.textSecondary,
                  fontSize: 13,
                }}>
                  {(t as any).garage?.noRecentLookups || 'No recent lookups'}
                </div>
              ) : (
                recentLookups.map((lookup, idx) => (
                  <button
                    key={lookup.vin}
                    onClick={() => handleRecentClick(lookup)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '12px 20px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: idx < recentLookups.length - 1 ? `1px solid ${C.border}` : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.bg }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Car size={16} color={C.textSecondary} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                        {lookup.year ? `${lookup.year} ` : ''}{lookup.make} {lookup.model}
                      </div>
                      <div style={{ fontSize: 11, color: C.textSecondary, fontFamily: 'monospace', letterSpacing: 1 }}>
                        {lookup.vin}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Spin animation ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
