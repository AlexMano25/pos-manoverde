import { create } from 'zustand'
import type { HotelRoom, HousekeepingTask, MinibarCharge, RoomStatus, HousekeepingStatus } from '../types'
import { db } from '../db/dexie'
import { generateUUID } from '../utils/uuid'

interface HotelState {
  rooms: HotelRoom[]
  housekeepingTasks: HousekeepingTask[]
  minibarCharges: MinibarCharge[]
  loading: boolean
}

interface HotelActions {
  loadRooms: (storeId: string) => Promise<void>
  createRoom: (room: Omit<HotelRoom, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<HotelRoom>
  updateRoom: (id: string, data: Partial<HotelRoom>) => Promise<void>
  updateRoomStatus: (id: string, status: RoomStatus) => Promise<void>
  deleteRoom: (id: string) => Promise<void>
  checkIn: (roomId: string, guestName: string, reservationId?: string, checkOutDate?: string) => Promise<void>
  checkOut: (roomId: string) => Promise<void>

  loadHousekeeping: (storeId: string) => Promise<void>
  createHousekeepingTask: (task: Omit<HousekeepingTask, 'id' | 'synced' | 'created_at' | 'updated_at'>) => Promise<void>
  updateHousekeepingStatus: (id: string, status: HousekeepingStatus) => Promise<void>

  loadMinibarCharges: (storeId: string) => Promise<void>
  addMinibarCharge: (charge: Omit<MinibarCharge, 'id' | 'synced' | 'created_at'>) => Promise<void>
  markChargesBilled: (roomId: string) => Promise<void>
}

export const useHotelStore = create<HotelState & HotelActions>()((set, get) => ({
  rooms: [],
  housekeepingTasks: [],
  minibarCharges: [],
  loading: false,

  loadRooms: async (storeId) => {
    set({ loading: true })
    const rooms = await db.hotel_rooms.where('store_id').equals(storeId).toArray()
    rooms.sort((a, b) => (a.floor * 1000 + parseInt(a.number)) - (b.floor * 1000 + parseInt(b.number)))
    set({ rooms, loading: false })
  },

  createRoom: async (roomData) => {
    const now = new Date().toISOString()
    const room: HotelRoom = { ...roomData, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.hotel_rooms.put(room)
    set({ rooms: [...get().rooms, room] })
    return room
  },

  updateRoom: async (id, data) => {
    const now = new Date().toISOString()
    await db.hotel_rooms.update(id, { ...data, updated_at: now, synced: false })
    set({ rooms: get().rooms.map(r => r.id === id ? { ...r, ...data, updated_at: now } : r) })
  },

  updateRoomStatus: async (id, status) => {
    await get().updateRoom(id, { status })
  },

  deleteRoom: async (id) => {
    await db.hotel_rooms.delete(id)
    set({ rooms: get().rooms.filter(r => r.id !== id) })
  },

  checkIn: async (roomId, guestName, reservationId, checkOutDate) => {
    await get().updateRoom(roomId, {
      status: 'occupied',
      current_guest_name: guestName,
      current_reservation_id: reservationId,
      check_in_date: new Date().toISOString().slice(0, 10),
      check_out_date: checkOutDate,
    })
  },

  checkOut: async (roomId) => {
    await get().updateRoom(roomId, {
      status: 'cleaning',
      current_guest_name: undefined,
      current_reservation_id: undefined,
      check_in_date: undefined,
      check_out_date: undefined,
    })
    // Auto-create housekeeping task
    const room = get().rooms.find(r => r.id === roomId)
    if (room) {
      await get().createHousekeepingTask({
        store_id: room.store_id,
        room_id: roomId,
        room_number: room.number,
        type: 'checkout_clean',
        status: 'pending',
        priority: 'high',
      })
    }
  },

  loadHousekeeping: async (storeId) => {
    const tasks = await db.housekeeping_tasks.where('store_id').equals(storeId).toArray()
    tasks.sort((a, b) => b.created_at.localeCompare(a.created_at))
    set({ housekeepingTasks: tasks })
  },

  createHousekeepingTask: async (taskData) => {
    const now = new Date().toISOString()
    const task: HousekeepingTask = { ...taskData, id: generateUUID(), synced: false, created_at: now, updated_at: now }
    await db.housekeeping_tasks.put(task)
    set({ housekeepingTasks: [task, ...get().housekeepingTasks] })
  },

  updateHousekeepingStatus: async (id, status) => {
    const now = new Date().toISOString()
    const updates: Partial<HousekeepingTask> = { status, updated_at: now, synced: false }
    if (status === 'in_progress') updates.started_at = now
    if (status === 'completed') updates.completed_at = now
    await db.housekeeping_tasks.update(id, updates)
    set({ housekeepingTasks: get().housekeepingTasks.map(t => t.id === id ? { ...t, ...updates } : t) })

    // When housekeeping completed, mark room as available
    if (status === 'completed') {
      const task = get().housekeepingTasks.find(t => t.id === id)
      if (task) {
        const room = get().rooms.find(r => r.id === task.room_id)
        if (room && room.status === 'cleaning') {
          await get().updateRoomStatus(task.room_id, 'available')
        }
      }
    }
  },

  loadMinibarCharges: async (storeId) => {
    const charges = await db.minibar_charges.where('store_id').equals(storeId).toArray()
    charges.sort((a, b) => b.created_at.localeCompare(a.created_at))
    set({ minibarCharges: charges })
  },

  addMinibarCharge: async (chargeData) => {
    const now = new Date().toISOString()
    const charge: MinibarCharge = { ...chargeData, id: generateUUID(), synced: false, created_at: now }
    await db.minibar_charges.put(charge)
    set({ minibarCharges: [charge, ...get().minibarCharges] })
  },

  markChargesBilled: async (roomId) => {
    const now = new Date().toISOString()
    const charges = get().minibarCharges.filter(c => c.room_id === roomId && !c.charged)
    for (const c of charges) {
      await db.minibar_charges.update(c.id, { charged: true, charged_at: now, synced: false })
    }
    set({
      minibarCharges: get().minibarCharges.map(c =>
        c.room_id === roomId && !c.charged ? { ...c, charged: true, charged_at: now } : c
      ),
    })
  },
}))
