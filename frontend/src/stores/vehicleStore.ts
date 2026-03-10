import { create } from 'zustand'
import type { Vehicle, VinDecodeResult, VehicleServiceRecord } from '../types'
import { db } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

interface VehicleState {
  vehicles: Vehicle[]
  serviceRecords: VehicleServiceRecord[]
  vinResult: VinDecodeResult | null
  vinLoading: boolean
  loading: boolean
}

interface VehicleActions {
  loadVehicles: (storeId: string) => Promise<void>
  createVehicle: (v: Omit<Vehicle, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<Vehicle>
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>

  loadServiceRecords: (storeId: string, vehicleId?: string) => Promise<void>
  createServiceRecord: (r: Omit<VehicleServiceRecord, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<void>
  updateServiceRecord: (id: string, data: Partial<VehicleServiceRecord>) => Promise<void>
  deleteServiceRecord: (id: string) => Promise<void>

  decodeVin: (vin: string) => Promise<VinDecodeResult>
  clearVinResult: () => void

  findVehicleByPlate: (storeId: string, plate: string) => Promise<Vehicle | undefined>
  findVehicleByVin: (storeId: string, vin: string) => Promise<Vehicle | undefined>
}

export const useVehicleStore = create<VehicleState & VehicleActions>()((set, get) => ({
  vehicles: [],
  serviceRecords: [],
  vinResult: null,
  vinLoading: false,
  loading: false,

  // ── Vehicles ─────────────────────────────────────────────────────────────
  loadVehicles: async (storeId) => {
    set({ loading: true })
    const vehicles = await db.vehicles.where('store_id').equals(storeId).toArray()
    vehicles.sort((a, b) => b.created_at.localeCompare(a.created_at))
    set({ vehicles, loading: false })
  },

  createVehicle: async (data) => {
    const now = new Date().toISOString()
    const vehicle: Vehicle = { ...data, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.vehicles.put(vehicle)
    set({ vehicles: [vehicle, ...get().vehicles] })
    return vehicle
  },

  updateVehicle: async (id, data) => {
    const now = new Date().toISOString()
    await db.vehicles.update(id, { ...data, updated_at: now, synced: false })
    set({ vehicles: get().vehicles.map(v => v.id === id ? { ...v, ...data, updated_at: now } : v) })
  },

  deleteVehicle: async (id) => {
    await db.vehicles.delete(id)
    set({ vehicles: get().vehicles.filter(v => v.id !== id) })
  },

  // ── Service Records ──────────────────────────────────────────────────────
  loadServiceRecords: async (storeId, vehicleId) => {
    let records = await db.vehicle_service_records.where('store_id').equals(storeId).toArray()
    if (vehicleId) records = records.filter(r => r.vehicle_id === vehicleId)
    records.sort((a, b) => b.service_date.localeCompare(a.service_date))
    set({ serviceRecords: records })
  },

  createServiceRecord: async (data) => {
    const now = new Date().toISOString()
    const record: VehicleServiceRecord = { ...data, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.vehicle_service_records.put(record)
    set({ serviceRecords: [record, ...get().serviceRecords] })
    // Update vehicle last_service_date
    if (data.vehicle_id) {
      await get().updateVehicle(data.vehicle_id, {
        last_service_date: data.service_date,
        mileage: data.mileage_at_service || undefined,
        next_service_date: data.next_service_date || undefined,
      })
    }
  },

  updateServiceRecord: async (id, data) => {
    const now = new Date().toISOString()
    await db.vehicle_service_records.update(id, { ...data, updated_at: now, synced: false })
    set({ serviceRecords: get().serviceRecords.map(r => r.id === id ? { ...r, ...data, updated_at: now } : r) })
  },

  deleteServiceRecord: async (id) => {
    await db.vehicle_service_records.delete(id)
    set({ serviceRecords: get().serviceRecords.filter(r => r.id !== id) })
  },

  // ── VIN Decoder (NHTSA API — free, no key required) ──────────────────────
  decodeVin: async (vin: string) => {
    set({ vinLoading: true, vinResult: null })
    try {
      const resp = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`)
      const json = await resp.json()
      const results: Array<{ Variable: string; Value: string | null }> = json.Results || []
      const val = (name: string) => results.find(r => r.Variable === name)?.Value || ''

      const result: VinDecodeResult = {
        vin,
        make: val('Make') || 'Unknown',
        model: val('Model') || 'Unknown',
        year: parseInt(val('Model Year')) || 0,
        body_class: val('Body Class') || undefined,
        engine_info: [val('Engine Number of Cylinders'), val('Displacement (L)')].filter(Boolean).join(' / ') || undefined,
        drive_type: val('Drive Type') || undefined,
        fuel_type: val('Fuel Type - Primary') || undefined,
        manufacturer: val('Manufacturer Name') || undefined,
        plant_country: val('Plant Country') || undefined,
        vehicle_type: val('Vehicle Type') || undefined,
      }

      // Check for error codes
      const errorCode = val('Error Code')
      if (errorCode && errorCode !== '0') {
        result.error = val('Error Text') || 'VIN decode error'
      }

      set({ vinResult: result, vinLoading: false })
      return result
    } catch (err) {
      const result: VinDecodeResult = {
        vin,
        make: '',
        model: '',
        year: 0,
        error: err instanceof Error ? err.message : 'Network error',
      }
      set({ vinResult: result, vinLoading: false })
      return result
    }
  },

  clearVinResult: () => set({ vinResult: null }),

  findVehicleByPlate: async (storeId, plate) => {
    const vehicles = await db.vehicles.where('store_id').equals(storeId).toArray()
    return vehicles.find(v => v.license_plate?.toLowerCase() === plate.toLowerCase())
  },

  findVehicleByVin: async (storeId, vin) => {
    const vehicles = await db.vehicles.where('store_id').equals(storeId).toArray()
    return vehicles.find(v => v.vin?.toLowerCase() === vin.toLowerCase())
  },
}))
