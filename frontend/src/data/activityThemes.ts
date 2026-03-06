import type { Activity } from '../types'

/**
 * Background wallpaper URLs per activity (Unsplash CDN).
 * Displayed at ~8% opacity behind the app UI for visual context.
 * Format: w=1200 for quality, q=60 for compression, auto=format for WebP.
 */
export const ACTIVITY_WALLPAPERS: Record<Activity, string> = {
  // Food & Beverage
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=60&auto=format',
  bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=60&auto=format',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=60&auto=format',

  // Retail
  supermarket: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=60&auto=format',
  pharmacy: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&q=60&auto=format',
  fashion: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=60&auto=format',
  electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&q=60&auto=format',
  florist: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&q=60&auto=format',
  pet_shop: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&q=60&auto=format',
  bookstore: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=60&auto=format',
  gas_station: 'https://images.unsplash.com/photo-1545262810-a5c4ef4c4486?w=1200&q=60&auto=format',

  // Services
  laundry: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=1200&q=60&auto=format',
  printing: 'https://images.unsplash.com/photo-1504270997636-07ddfbd48945?w=1200&q=60&auto=format',
  home_cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=60&auto=format',
  car_wash: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&q=60&auto=format',
  services: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=60&auto=format',

  // Hospitality
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=60&auto=format',

  // Real Estate
  real_estate: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=60&auto=format',

  // Education
  school: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=60&auto=format',
  daycare: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=1200&q=60&auto=format',

  // Travel
  travel_agency: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=60&auto=format',

  // Wellness & Fitness
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=60&auto=format',
  spa: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=60&auto=format',
  pool: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=60&auto=format',

  // Auto
  auto_repair: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&q=60&auto=format',

  // Beauty
  hair_salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=60&auto=format',
}
