import type { Activity, Product } from '../types'
import { SAMPLE_PRODUCTS } from '../data/sampleProducts'
import { generateUUID } from './uuid'
import { db } from '../db/dexie'
import { supabase } from '../services/supabase'

export async function seedSampleProducts(
  storeId: string,
  activity: Activity,
): Promise<void> {
  const samples = SAMPLE_PRODUCTS[activity]
  if (!samples || samples.length === 0) return

  const now = new Date().toISOString()
  const products: Product[] = samples.map((s) => ({
    id: generateUUID(),
    store_id: storeId,
    name: s.name,
    price: s.price,
    cost: s.cost,
    stock: s.stock,
    min_stock: Math.max(1, Math.floor(s.stock * 0.1)),
    category: s.category,
    unit: s.unit || 'piece',
    is_active: true,
    created_at: now,
    updated_at: now,
    // Activity-specific fields
    description: s.description,
    expiry_date: s.expiry_date,
    dosage: s.dosage,
    manufacturer: s.manufacturer,
    room_type: s.room_type,
    room_number: s.room_number,
    duration_minutes: s.duration_minutes,
    weight_kg: s.weight_kg,
    size: s.size,
    color: s.color,
    vehicle_type: s.vehicle_type,
    author: s.author,
    isbn: s.isbn,
    destination: s.destination,
    age_group: s.age_group,
  }))

  // Insert into Supabase (cloud)
  if (supabase) {
    await supabase.from('products').insert(products)
  }

  // Insert into IndexedDB (local)
  await db.products.bulkAdd(products)
}
