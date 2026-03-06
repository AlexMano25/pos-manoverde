import type React from 'react'
import {
  UtensilsCrossed,
  ShoppingBasket,
  Pill,
  Shirt,
  Smartphone,
  Briefcase,
  Beer,
  Croissant,
  Hotel,
  Scissors,
  Sparkles,
  Dumbbell,
  Waves,
  Car,
  Fuel,
  WashingMachine,
  Wrench,
  Baby,
  GraduationCap,
  Home,
  Flower2,
  PawPrint,
  BookOpen,
  Printer as PrinterIcon,
  Building2,
  Plane,
} from 'lucide-react'
import type { Activity } from '../types'

// ── Shared activity icon mapping ─────────────────────────────────────────────
// Used by: LandingPage, RegistrationPage, SetupPage

export const ACTIVITY_ICONS: Record<Activity, React.ElementType> = {
  restaurant: UtensilsCrossed,
  supermarket: ShoppingBasket,
  pharmacy: Pill,
  fashion: Shirt,
  electronics: Smartphone,
  services: Briefcase,
  bar: Beer,
  bakery: Croissant,
  hotel: Hotel,
  hair_salon: Scissors,
  spa: Sparkles,
  gym: Dumbbell,
  pool: Waves,
  car_wash: Car,
  gas_station: Fuel,
  laundry: WashingMachine,
  auto_repair: Wrench,
  daycare: Baby,
  school: GraduationCap,
  home_cleaning: Home,
  florist: Flower2,
  pet_shop: PawPrint,
  bookstore: BookOpen,
  printing: PrinterIcon,
  real_estate: Building2,
  travel_agency: Plane,
}

// ── Ordered list of all 26 activities ────────────────────────────────────────

export const ALL_ACTIVITIES: Activity[] = [
  'restaurant', 'supermarket', 'pharmacy', 'fashion', 'electronics', 'services',
  'bar', 'bakery', 'hotel', 'hair_salon', 'spa', 'gym',
  'pool', 'car_wash', 'gas_station', 'laundry', 'auto_repair',
  'daycare', 'school', 'home_cleaning', 'florist', 'pet_shop',
  'bookstore', 'printing', 'real_estate', 'travel_agency',
]

// ── Brand colors per activity (used on landing page cards) ───────────────────

export const ACTIVITY_COLORS: Record<Activity, string> = {
  restaurant: '#ef4444',
  supermarket: '#16a34a',
  pharmacy: '#2563eb',
  fashion: '#e11d48',
  electronics: '#0891b2',
  services: '#475569',
  bar: '#8b5cf6',
  bakery: '#f59e0b',
  hotel: '#9333ea',
  hair_salon: '#ec4899',
  spa: '#14b8a6',
  gym: '#f97316',
  pool: '#0ea5e9',
  car_wash: '#6366f1',
  gas_station: '#eab308',
  laundry: '#84cc16',
  auto_repair: '#78716c',
  daycare: '#d946ef',
  school: '#059669',
  home_cleaning: '#38bdf8',
  florist: '#fb7185',
  pet_shop: '#d97706',
  bookstore: '#4f46e5',
  printing: '#6b7280',
  real_estate: '#3b82f6',
  travel_agency: '#06b6d4',
}
