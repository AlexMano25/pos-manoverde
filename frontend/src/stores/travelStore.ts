import { create } from 'zustand'
import type { TravelPackage, Itinerary, TravelBooking, BookingStatus } from '../types'
import { db } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

interface TravelState {
  packages: TravelPackage[]
  itineraries: Itinerary[]
  bookings: TravelBooking[]
  loading: boolean
}

interface TravelActions {
  loadPackages: (storeId: string) => Promise<void>
  createPackage: (p: Omit<TravelPackage, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<TravelPackage>
  updatePackage: (id: string, data: Partial<TravelPackage>) => Promise<void>
  deletePackage: (id: string) => Promise<void>

  loadItineraries: (storeId: string) => Promise<void>
  createItinerary: (i: Omit<Itinerary, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<Itinerary>
  updateItinerary: (id: string, data: Partial<Itinerary>) => Promise<void>
  deleteItinerary: (id: string) => Promise<void>

  loadBookings: (storeId: string) => Promise<void>
  createBooking: (b: Omit<TravelBooking, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<TravelBooking>
  updateBooking: (id: string, data: Partial<TravelBooking>) => Promise<void>
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>
  deleteBooking: (id: string) => Promise<void>
}

function nextBookingNumber(): string {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  return `BK-${ymd}-${seq}`
}

export const useTravelStore = create<TravelState & TravelActions>()((set, get) => ({
  packages: [],
  itineraries: [],
  bookings: [],
  loading: false,

  // ── Packages ─────────────────────────────────────────────────────────────
  loadPackages: async (storeId) => {
    set({ loading: true })
    const packages = await db.travel_packages.where('store_id').equals(storeId).toArray()
    packages.sort((a, b) => b.created_at.localeCompare(a.created_at))
    set({ packages, loading: false })
  },

  createPackage: async (data) => {
    const now = new Date().toISOString()
    const pkg: TravelPackage = { ...data, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.travel_packages.put(pkg)
    set({ packages: [pkg, ...get().packages] })
    return pkg
  },

  updatePackage: async (id, data) => {
    const now = new Date().toISOString()
    await db.travel_packages.update(id, { ...data, updated_at: now, synced: false })
    set({ packages: get().packages.map(p => p.id === id ? { ...p, ...data, updated_at: now } : p) })
  },

  deletePackage: async (id) => {
    await db.travel_packages.delete(id)
    set({ packages: get().packages.filter(p => p.id !== id) })
  },

  // ── Itineraries ──────────────────────────────────────────────────────────
  loadItineraries: async (storeId) => {
    const itineraries = await db.itineraries.where('store_id').equals(storeId).toArray()
    itineraries.sort((a, b) => b.created_at.localeCompare(a.created_at))
    set({ itineraries })
  },

  createItinerary: async (data) => {
    const now = new Date().toISOString()
    const it: Itinerary = { ...data, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.itineraries.put(it)
    set({ itineraries: [it, ...get().itineraries] })
    return it
  },

  updateItinerary: async (id, data) => {
    const now = new Date().toISOString()
    await db.itineraries.update(id, { ...data, updated_at: now, synced: false })
    set({ itineraries: get().itineraries.map(i => i.id === id ? { ...i, ...data, updated_at: now } : i) })
  },

  deleteItinerary: async (id) => {
    await db.itineraries.delete(id)
    set({ itineraries: get().itineraries.filter(i => i.id !== id) })
  },

  // ── Bookings ─────────────────────────────────────────────────────────────
  loadBookings: async (storeId) => {
    const bookings = await db.travel_bookings.where('store_id').equals(storeId).toArray()
    bookings.sort((a, b) => b.created_at.localeCompare(a.created_at))
    set({ bookings })
  },

  createBooking: async (data) => {
    const now = new Date().toISOString()
    const booking: TravelBooking = {
      ...data,
      id: generateUUID(),
      booking_number: data.booking_number || nextBookingNumber(),
      synced: false,
      created_at: now,
      updated_at: now,
    }
    await db.travel_bookings.put(booking)
    set({ bookings: [booking, ...get().bookings] })
    // Decrement package spots
    if (booking.package_id) {
      const pkg = get().packages.find(p => p.id === booking.package_id)
      if (pkg && pkg.spots_remaining > 0) {
        await get().updatePackage(pkg.id, { spots_remaining: Math.max(0, pkg.spots_remaining - booking.travelers) })
      }
    }
    return booking
  },

  updateBooking: async (id, data) => {
    const now = new Date().toISOString()
    await db.travel_bookings.update(id, { ...data, updated_at: now, synced: false })
    set({ bookings: get().bookings.map(b => b.id === id ? { ...b, ...data, updated_at: now } : b) })
  },

  updateBookingStatus: async (id, status) => {
    await get().updateBooking(id, { status })
  },

  deleteBooking: async (id) => {
    await db.travel_bookings.delete(id)
    set({ bookings: get().bookings.filter(b => b.id !== id) })
  },
}))
