import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Loader2,
  Car,
  ChevronDown,
  ChevronUp,
  Gauge,
  User,
  Wrench,
  DollarSign,
  Clock,
  Hash,
  Settings,
  TrendingUp,
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useVehicleStore } from '../stores/vehicleStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { formatCurrency } from '../utils/currency'
import type { VehicleServiceRecord } from '../types'

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

// ── Service type config ──────────────────────────────────────────────────

type ServiceType = VehicleServiceRecord['service_type']

const SERVICE_TYPE_CONFIG: Record<ServiceType, { label: string; color: string; bg: string }> = {
  oil_change:     { label: 'Oil Change',      color: '#f59e0b', bg: '#fffbeb' },
  tire_rotation:  { label: 'Tire Rotation',   color: '#3b82f6', bg: '#eff6ff' },
  brake_service:  { label: 'Brake Service',   color: '#ef4444', bg: '#fef2f2' },
  inspection:     { label: 'Inspection',      color: '#8b5cf6', bg: '#f5f3ff' },
  repair:         { label: 'Repair',          color: '#ea580c', bg: '#fff7ed' },
  bodywork:       { label: 'Bodywork',        color: '#06b6d4', bg: '#ecfeff' },
  electrical:     { label: 'Electrical',      color: '#eab308', bg: '#fefce8' },
  ac_service:     { label: 'A/C Service',     color: '#0ea5e9', bg: '#f0f9ff' },
  other:          { label: 'Other',           color: '#64748b', bg: '#f8fafc' },
}

const SERVICE_TYPES: ServiceType[] = [
  'oil_change', 'tire_rotation', 'brake_service', 'inspection',
  'repair', 'bodywork', 'electrical', 'ac_service', 'other',
]

// ── Empty form defaults ──────────────────────────────────────────────────

interface VehicleForm {
  make: string
  model: string
  year: string
  vin: string
  license_plate: string
  color: string
  engine_type: string
  transmission: 'manual' | 'automatic' | ''
  mileage: string
  customer_name: string
  customer_phone: string
  notes: string
}

const emptyVehicleForm: VehicleForm = {
  make: '', model: '', year: '', vin: '', license_plate: '',
  color: '', engine_type: '', transmission: '', mileage: '',
  customer_name: '', customer_phone: '', notes: '',
}

interface ServiceForm {
  vehicle_id: string
  service_type: ServiceType
  description: string
  mileage_at_service: string
  parts_used: string
  labor_hours: string
  total_cost: string
  technician_name: string
  service_date: string
  next_service_date: string
  next_service_mileage: string
  notes: string
}

const emptyServiceForm: ServiceForm = {
  vehicle_id: '', service_type: 'oil_change', description: '',
  mileage_at_service: '', parts_used: '', labor_hours: '',
  total_cost: '', technician_name: '', service_date: new Date().toISOString().slice(0, 10),
  next_service_date: '', next_service_mileage: '', notes: '',
}

// ── Component ────────────────────────────────────────────────────────────

export default function VehicleHistoryPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()
  const {
    vehicles, serviceRecords, loading,
    loadVehicles, createVehicle, loadServiceRecords, createServiceRecord,
  } = useVehicleStore()

  const [search, setSearch] = useState('')
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({ ...emptyVehicleForm })
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ ...emptyServiceForm })
  const [saving, setSaving] = useState(false)

  const storeId = currentStore?.id || ''
  const currency = currentStore?.currency || 'XOF'

  // ── Load data ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (storeId) {
      loadVehicles(storeId)
      loadServiceRecords(storeId)
    }
  }, [storeId, loadVehicles, loadServiceRecords])

  // ── Filtered vehicles ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles
    const q = search.toLowerCase()
    return vehicles.filter(v =>
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.license_plate || '').toLowerCase().includes(q) ||
      (v.vin || '').toLowerCase().includes(q) ||
      (v.customer_name || '').toLowerCase().includes(q)
    )
  }, [vehicles, search])

  // ── Stats ──────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthRecords = serviceRecords.filter(r => r.service_date >= monthStart)
    const totalRevenue = serviceRecords.reduce((sum, r) => sum + r.total_cost, 0)
    const avgCost = serviceRecords.length > 0 ? totalRevenue / serviceRecords.length : 0

    return {
      totalVehicles: vehicles.length,
      servicesThisMonth: thisMonthRecords.length,
      totalRevenue,
      avgCost,
    }
  }, [vehicles, serviceRecords])

  // ── Service records for a vehicle ──────────────────────────────────────

  const getVehicleRecords = (vehicleId: string) =>
    serviceRecords.filter(r => r.vehicle_id === vehicleId)

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleToggleExpand = (vehicleId: string) => {
    setExpandedVehicleId(prev => prev === vehicleId ? null : vehicleId)
  }

  const handleSaveVehicle = async () => {
    if (!vehicleForm.make.trim() || !vehicleForm.model.trim() || !storeId) return
    setSaving(true)
    try {
      await createVehicle({
        store_id: storeId,
        make: vehicleForm.make.trim(),
        model: vehicleForm.model.trim(),
        year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
        vin: vehicleForm.vin.trim() || undefined,
        license_plate: vehicleForm.license_plate.trim() || undefined,
        color: vehicleForm.color.trim() || undefined,
        engine_type: vehicleForm.engine_type.trim() || undefined,
        transmission: (vehicleForm.transmission as 'manual' | 'automatic') || undefined,
        mileage: vehicleForm.mileage ? parseInt(vehicleForm.mileage) : undefined,
        customer_name: vehicleForm.customer_name.trim() || undefined,
        customer_phone: vehicleForm.customer_phone.trim() || undefined,
        notes: vehicleForm.notes.trim() || undefined,
      })
      setShowVehicleModal(false)
      setVehicleForm({ ...emptyVehicleForm })
    } catch (err) {
      console.error('[VehicleHistory] Failed to save vehicle:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveService = async () => {
    if (!serviceForm.vehicle_id || !serviceForm.description.trim() || !storeId) return
    setSaving(true)
    try {
      const vehicle = vehicles.find(v => v.id === serviceForm.vehicle_id)
      const display = vehicle
        ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ' ' + vehicle.year : ''}${vehicle.license_plate ? ' - ' + vehicle.license_plate : ''}`
        : ''

      await createServiceRecord({
        store_id: storeId,
        vehicle_id: serviceForm.vehicle_id,
        vehicle_display: display,
        service_type: serviceForm.service_type,
        description: serviceForm.description.trim(),
        mileage_at_service: serviceForm.mileage_at_service ? parseInt(serviceForm.mileage_at_service) : undefined,
        parts_used: serviceForm.parts_used.trim() ? serviceForm.parts_used.split(',').map(s => s.trim()) : undefined,
        labor_hours: serviceForm.labor_hours ? parseFloat(serviceForm.labor_hours) : undefined,
        total_cost: parseFloat(serviceForm.total_cost) || 0,
        technician_name: serviceForm.technician_name.trim() || undefined,
        service_date: serviceForm.service_date,
        next_service_date: serviceForm.next_service_date || undefined,
        next_service_mileage: serviceForm.next_service_mileage ? parseInt(serviceForm.next_service_mileage) : undefined,
        notes: serviceForm.notes.trim() || undefined,
      })
      setShowServiceModal(false)
      setServiceForm({ ...emptyServiceForm })
      // Reload records
      await loadServiceRecords(storeId)
    } catch (err) {
      console.error('[VehicleHistory] Failed to save service record:', err)
    } finally {
      setSaving(false)
    }
  }

  const openAddService = (vehicleId?: string) => {
    setServiceForm({ ...emptyServiceForm, vehicle_id: vehicleId || '' })
    setShowServiceModal(true)
  }

  // ── Input helper ───────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    outline: 'none',
    color: C.text,
    backgroundColor: C.bg,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: C.textSecondary,
    marginBottom: 4,
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: rv(16, 24, 32), backgroundColor: C.bg, minHeight: '100vh' }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 12,
        marginBottom: rv(20, 28, 32),
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: rv(22, 26, 28), fontWeight: 800, color: C.text }}>
            {(t as any).garage?.vehicleHistory || 'Vehicle History'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: C.textSecondary }}>
            {(t as any).garage?.vehicleHistoryDesc || 'Manage vehicles and service records'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => openAddService()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', backgroundColor: C.card,
              color: C.primary, border: `1px solid ${C.primary}`,
              borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Wrench size={16} />
            {(t as any).garage?.addService || 'Add Service'}
          </button>
          <button
            onClick={() => { setVehicleForm({ ...emptyVehicleForm }); setShowVehicleModal(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', backgroundColor: C.primary,
              color: '#ffffff', border: 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            {(t as any).garage?.addVehicle || 'Add Vehicle'}
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: rv('1fr 1fr', '1fr 1fr 1fr 1fr', '1fr 1fr 1fr 1fr'),
        gap: rv(10, 16, 16),
        marginBottom: 24,
      }}>
        {[
          { label: (t as any).garage?.totalVehicles || 'Total Vehicles', value: String(stats.totalVehicles), icon: Car, color: C.primary },
          { label: (t as any).garage?.servicesThisMonth || 'Services This Month', value: String(stats.servicesThisMonth), icon: Wrench, color: C.success },
          { label: (t as any).garage?.totalRevenue || 'Total Revenue', value: formatCurrency(stats.totalRevenue, currency), icon: DollarSign, color: '#8b5cf6' },
          { label: (t as any).garage?.avgServiceCost || 'Avg Service Cost', value: formatCurrency(stats.avgCost, currency), icon: TrendingUp, color: C.warning },
        ].map((stat, i) => (
          <div key={i} style={{
            backgroundColor: C.card,
            borderRadius: 12,
            padding: rv(14, 18, 20),
            border: `1px solid ${C.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: stat.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={16} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: rv(18, 22, 24), fontWeight: 800, color: C.text }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        marginBottom: 20,
      }}>
        <Search size={18} color={C.textSecondary} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={(t as any).garage?.searchVehicles || 'Search by plate, VIN, make, model, customer...'}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            fontSize: 14,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            outline: 'none',
            color: C.text,
            backgroundColor: C.card,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── Vehicle List ──────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={32} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          backgroundColor: C.card, borderRadius: 12, padding: 48,
          border: `1px solid ${C.border}`, textAlign: 'center',
        }}>
          <Car size={48} color={C.border} strokeWidth={1.5} />
          <p style={{ margin: '12px 0 0', fontSize: 15, color: C.textSecondary, fontWeight: 500 }}>
            {search ? ((t as any).garage?.noVehiclesFound || 'No vehicles found') : ((t as any).garage?.noVehiclesYet || 'No vehicles yet. Add your first vehicle.')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(vehicle => {
            const isExpanded = expandedVehicleId === vehicle.id
            const records = getVehicleRecords(vehicle.id)

            return (
              <div key={vehicle.id} style={{
                backgroundColor: C.card,
                borderRadius: 12,
                border: `1px solid ${isExpanded ? C.primary : C.border}`,
                boxShadow: isExpanded ? `0 0 0 2px ${C.primary}25` : '0 1px 3px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}>
                {/* Vehicle card header */}
                <button
                  onClick={() => handleToggleExpand(vehicle.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: rv(10, 16, 20),
                    padding: rv(14, 18, 20),
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Car icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    backgroundColor: C.primary + '12',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Car size={22} color={C.primary} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: rv(15, 16, 17), fontWeight: 700, color: C.text }}>
                      {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: rv(6, 12, 16), marginTop: 4 }}>
                      {vehicle.license_plate && (
                        <span style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Hash size={11} /> {vehicle.license_plate}
                        </span>
                      )}
                      {vehicle.vin && (
                        <span style={{ fontSize: 12, color: C.textSecondary, fontFamily: 'monospace' }}>
                          VIN: {vehicle.vin.slice(0, 8)}...
                        </span>
                      )}
                      {vehicle.customer_name && (
                        <span style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={11} /> {vehicle.customer_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side info */}
                  {!isMobile && (
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                      {vehicle.mileage != null && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: C.textSecondary }}>
                            {(t as any).garage?.mileage || 'Mileage'}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                            {vehicle.mileage.toLocaleString()} km
                          </div>
                        </div>
                      )}
                      {vehicle.last_service_date && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: C.textSecondary }}>
                            {(t as any).garage?.lastService || 'Last Service'}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                            {new Date(vehicle.last_service_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expand arrow */}
                  <div style={{ flexShrink: 0, color: C.textSecondary }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Expanded: service history timeline */}
                {isExpanded && (
                  <div style={{
                    borderTop: `1px solid ${C.border}`,
                    padding: rv(14, 20, 24),
                    backgroundColor: '#fafbfc',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {(t as any).garage?.serviceHistory || 'Service History'}
                        <span style={{
                          marginLeft: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.primary,
                          backgroundColor: C.primary + '15',
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}>
                          {records.length}
                        </span>
                      </span>
                      <button
                        onClick={() => openAddService(vehicle.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '6px 14px', backgroundColor: C.primary,
                          color: '#ffffff', border: 'none', borderRadius: 8,
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <Plus size={14} />
                        {(t as any).garage?.addServiceRecord || 'Add'}
                      </button>
                    </div>

                    {records.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 24, color: C.textSecondary, fontSize: 13 }}>
                        {(t as any).garage?.noServiceRecords || 'No service records yet'}
                      </div>
                    ) : (
                      <div style={{ position: 'relative', paddingLeft: 24 }}>
                        {/* Timeline line */}
                        <div style={{
                          position: 'absolute',
                          left: 7,
                          top: 8,
                          bottom: 8,
                          width: 2,
                          backgroundColor: C.border,
                        }} />

                        {records.map((record, idx) => {
                          const cfg = SERVICE_TYPE_CONFIG[record.service_type] || SERVICE_TYPE_CONFIG.other
                          return (
                            <div key={record.id} style={{
                              position: 'relative',
                              marginBottom: idx < records.length - 1 ? 16 : 0,
                            }}>
                              {/* Timeline dot */}
                              <div style={{
                                position: 'absolute',
                                left: -20,
                                top: 8,
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: cfg.color,
                                border: '2px solid #ffffff',
                                boxShadow: '0 0 0 2px ' + cfg.color + '30',
                              }} />

                              <div style={{
                                backgroundColor: C.card,
                                borderRadius: 10,
                                padding: rv(12, 16, 16),
                                border: `1px solid ${C.border}`,
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: isMobile ? 'flex-start' : 'center',
                                  justifyContent: 'space-between',
                                  flexDirection: isMobile ? 'column' : 'row',
                                  gap: 8,
                                  marginBottom: 8,
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                      padding: '3px 10px',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: cfg.color,
                                      backgroundColor: cfg.bg,
                                    }}>
                                      {(t as any).garage?.serviceTypes?.[record.service_type] || cfg.label}
                                    </span>
                                    <span style={{ fontSize: 12, color: C.textSecondary }}>
                                      {new Date(record.service_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                                    {formatCurrency(record.total_cost, currency)}
                                  </span>
                                </div>

                                <p style={{ margin: '0 0 8px', fontSize: 14, color: C.text, lineHeight: 1.5 }}>
                                  {record.description}
                                </p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: rv(8, 16, 20), fontSize: 12, color: C.textSecondary }}>
                                  {record.mileage_at_service != null && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Gauge size={12} /> {record.mileage_at_service.toLocaleString()} km
                                    </span>
                                  )}
                                  {record.technician_name && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <User size={12} /> {record.technician_name}
                                    </span>
                                  )}
                                  {record.labor_hours != null && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Clock size={12} /> {record.labor_hours}h
                                    </span>
                                  )}
                                  {record.parts_used && record.parts_used.length > 0 && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Settings size={12} /> {record.parts_used.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Vehicle Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title={(t as any).garage?.addVehicle || 'Add Vehicle'}
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>{(t as any).garage?.make || 'Make'} *</label>
            <input style={inputStyle} value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} placeholder="Toyota" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.model || 'Model'} *</label>
            <input style={inputStyle} value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="Corolla" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.year || 'Year'}</label>
            <input style={inputStyle} type="number" value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })} placeholder="2023" />
          </div>
          <div>
            <label style={labelStyle}>VIN</label>
            <input style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1 }} value={vehicleForm.vin} onChange={e => setVehicleForm({ ...vehicleForm, vin: e.target.value.toUpperCase() })} placeholder="1HGBH41JXMN109186" maxLength={17} />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.licensePlate || 'License Plate'}</label>
            <input style={inputStyle} value={vehicleForm.license_plate} onChange={e => setVehicleForm({ ...vehicleForm, license_plate: e.target.value.toUpperCase() })} placeholder="AB-123-CD" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.color || 'Color'}</label>
            <input style={inputStyle} value={vehicleForm.color} onChange={e => setVehicleForm({ ...vehicleForm, color: e.target.value })} placeholder="Silver" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.engineType || 'Engine'}</label>
            <input style={inputStyle} value={vehicleForm.engine_type} onChange={e => setVehicleForm({ ...vehicleForm, engine_type: e.target.value })} placeholder="1.6L Diesel" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.transmission || 'Transmission'}</label>
            <select
              style={inputStyle}
              value={vehicleForm.transmission}
              onChange={e => setVehicleForm({ ...vehicleForm, transmission: e.target.value as any })}
            >
              <option value="">--</option>
              <option value="manual">{(t as any).garage?.manual || 'Manual'}</option>
              <option value="automatic">{(t as any).garage?.automatic || 'Automatic'}</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.mileage || 'Mileage'} (km)</label>
            <input style={inputStyle} type="number" value={vehicleForm.mileage} onChange={e => setVehicleForm({ ...vehicleForm, mileage: e.target.value })} placeholder="85000" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.customerName || 'Customer Name'}</label>
            <input style={inputStyle} value={vehicleForm.customer_name} onChange={e => setVehicleForm({ ...vehicleForm, customer_name: e.target.value })} placeholder="Jean Dupont" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.customerPhone || 'Customer Phone'}</label>
            <input style={inputStyle} type="tel" value={vehicleForm.customer_phone} onChange={e => setVehicleForm({ ...vehicleForm, customer_phone: e.target.value })} placeholder="+225 07 00 00 00" />
          </div>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label style={labelStyle}>{(t as any).common?.notes || 'Notes'}</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              value={vehicleForm.notes}
              onChange={e => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button
            onClick={() => setShowVehicleModal(false)}
            style={{
              padding: '10px 20px', backgroundColor: C.bg,
              color: C.textSecondary, border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {(t as any).common?.cancel || 'Cancel'}
          </button>
          <button
            onClick={handleSaveVehicle}
            disabled={saving || !vehicleForm.make.trim() || !vehicleForm.model.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', backgroundColor: C.primary,
              color: '#ffffff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving || !vehicleForm.make.trim() || !vehicleForm.model.trim() ? 0.6 : 1,
            }}
          >
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {(t as any).common?.save || 'Save'}
          </button>
        </div>
      </Modal>

      {/* ── Add Service Record Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        title={(t as any).garage?.addServiceRecord || 'Add Service Record'}
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label style={labelStyle}>{(t as any).garage?.vehicle || 'Vehicle'} *</label>
            <select
              style={inputStyle}
              value={serviceForm.vehicle_id}
              onChange={e => setServiceForm({ ...serviceForm, vehicle_id: e.target.value })}
            >
              <option value="">{(t as any).garage?.selectVehicle || 'Select a vehicle...'}</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.year ? `${v.year} ` : ''}{v.make} {v.model}{v.license_plate ? ` - ${v.license_plate}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.serviceType || 'Service Type'} *</label>
            <select
              style={inputStyle}
              value={serviceForm.service_type}
              onChange={e => setServiceForm({ ...serviceForm, service_type: e.target.value as ServiceType })}
            >
              {SERVICE_TYPES.map(st => (
                <option key={st} value={st}>
                  {(t as any).garage?.serviceTypes?.[st] || SERVICE_TYPE_CONFIG[st].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.serviceDate || 'Service Date'} *</label>
            <input style={inputStyle} type="date" value={serviceForm.service_date} onChange={e => setServiceForm({ ...serviceForm, service_date: e.target.value })} />
          </div>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label style={labelStyle}>{(t as any).common?.description || 'Description'} *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              value={serviceForm.description}
              onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
              placeholder={(t as any).garage?.serviceDescPlaceholder || 'Describe the service performed...'}
            />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.mileage || 'Mileage'} (km)</label>
            <input style={inputStyle} type="number" value={serviceForm.mileage_at_service} onChange={e => setServiceForm({ ...serviceForm, mileage_at_service: e.target.value })} placeholder="85000" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.totalCost || 'Total Cost'} *</label>
            <input style={inputStyle} type="number" step="0.01" value={serviceForm.total_cost} onChange={e => setServiceForm({ ...serviceForm, total_cost: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.laborHours || 'Labor Hours'}</label>
            <input style={inputStyle} type="number" step="0.5" value={serviceForm.labor_hours} onChange={e => setServiceForm({ ...serviceForm, labor_hours: e.target.value })} placeholder="2.5" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.technician || 'Technician'}</label>
            <input style={inputStyle} value={serviceForm.technician_name} onChange={e => setServiceForm({ ...serviceForm, technician_name: e.target.value })} placeholder="Kouassi Jean" />
          </div>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label style={labelStyle}>{(t as any).garage?.partsUsed || 'Parts Used'} ({(t as any).garage?.commaSeparated || 'comma-separated'})</label>
            <input style={inputStyle} value={serviceForm.parts_used} onChange={e => setServiceForm({ ...serviceForm, parts_used: e.target.value })} placeholder="Oil filter, Engine oil 5W30, Drain plug gasket" />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.nextServiceDate || 'Next Service Date'}</label>
            <input style={inputStyle} type="date" value={serviceForm.next_service_date} onChange={e => setServiceForm({ ...serviceForm, next_service_date: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>{(t as any).garage?.nextServiceMileage || 'Next Service Mileage'}</label>
            <input style={inputStyle} type="number" value={serviceForm.next_service_mileage} onChange={e => setServiceForm({ ...serviceForm, next_service_mileage: e.target.value })} placeholder="95000" />
          </div>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label style={labelStyle}>{(t as any).common?.notes || 'Notes'}</label>
            <textarea
              style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }}
              value={serviceForm.notes}
              onChange={e => setServiceForm({ ...serviceForm, notes: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button
            onClick={() => setShowServiceModal(false)}
            style={{
              padding: '10px 20px', backgroundColor: C.bg,
              color: C.textSecondary, border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {(t as any).common?.cancel || 'Cancel'}
          </button>
          <button
            onClick={handleSaveService}
            disabled={saving || !serviceForm.vehicle_id || !serviceForm.description.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', backgroundColor: C.primary,
              color: '#ffffff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving || !serviceForm.vehicle_id || !serviceForm.description.trim() ? 0.6 : 1,
            }}
          >
            {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {(t as any).common?.save || 'Save'}
          </button>
        </div>
      </Modal>

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
