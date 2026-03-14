import type { Activity } from '../types'

/**
 * Describes one extra product field that is relevant for a given activity.
 */
export type ActivityFieldConfig = {
  /** Must match an optional key on the Product type */
  key: string
  /** Translation key, e.g. "products.expiryDate" */
  i18nKey: string
  /** HTML input type to render */
  inputType: 'text' | 'date' | 'number' | 'select'
  /** Allowed values when inputType is 'select' */
  options?: string[]
}

/**
 * Maps each activity to the extra product fields it needs.
 * Activities not listed here use only the base product fields.
 */
export const ACTIVITY_PRODUCT_FIELDS: Partial<Record<Activity, ActivityFieldConfig[]>> = {
  pharmacy: [
    { key: 'expiry_date', i18nKey: 'products.expiryDate', inputType: 'date' },
    { key: 'dosage', i18nKey: 'products.dosage', inputType: 'text' },
    { key: 'manufacturer', i18nKey: 'products.manufacturer', inputType: 'text' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  restaurant: [
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
    { key: 'duration_minutes', i18nKey: 'products.prepTime', inputType: 'number' },
  ],

  hotel: [
    {
      key: 'room_type',
      i18nKey: 'products.roomType',
      inputType: 'select',
      options: ['single', 'double', 'suite', 'apartment'],
    },
    { key: 'room_number', i18nKey: 'products.roomNumber', inputType: 'text' },
  ],

  fashion: [
    { key: 'size', i18nKey: 'products.size', inputType: 'text' },
    { key: 'color', i18nKey: 'products.color', inputType: 'text' },
    { key: 'manufacturer', i18nKey: 'products.brand', inputType: 'text' },
  ],

  supermarket: [
    { key: 'expiry_date', i18nKey: 'products.expiryDate', inputType: 'date' },
    { key: 'weight_kg', i18nKey: 'products.weight', inputType: 'number' },
    { key: 'manufacturer', i18nKey: 'products.brand', inputType: 'text' },
  ],

  bakery: [
    { key: 'expiry_date', i18nKey: 'products.expiryDate', inputType: 'date' },
    { key: 'weight_kg', i18nKey: 'products.weight', inputType: 'number' },
  ],

  hair_salon: [
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  spa: [
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  gym: [
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  bookstore: [
    { key: 'author', i18nKey: 'products.author', inputType: 'text' },
    { key: 'isbn', i18nKey: 'products.isbn', inputType: 'text' },
    { key: 'manufacturer', i18nKey: 'products.publisher', inputType: 'text' },
  ],

  auto_repair: [
    {
      key: 'vehicle_type',
      i18nKey: 'products.vehicleType',
      inputType: 'select',
      options: ['car', 'moto', 'truck', 'bus'],
    },
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
  ],

  car_wash: [
    {
      key: 'vehicle_type',
      i18nKey: 'products.vehicleType',
      inputType: 'select',
      options: ['car', 'moto', 'truck'],
    },
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
  ],

  gas_station: [
    {
      key: 'vehicle_type',
      i18nKey: 'products.vehicleType',
      inputType: 'select',
      options: ['car', 'moto', 'truck'],
    },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  electronics: [
    { key: 'manufacturer', i18nKey: 'products.brand', inputType: 'text' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  travel_agency: [
    { key: 'destination', i18nKey: 'products.destination', inputType: 'text' },
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  daycare: [
    {
      key: 'age_group',
      i18nKey: 'products.ageGroup',
      inputType: 'select',
      options: ['0-1', '1-3', '3-6'],
    },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  school: [
    {
      key: 'age_group',
      i18nKey: 'products.ageGroup',
      inputType: 'select',
      options: ['3-6', '6-12', '12-18', '18+'],
    },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  florist: [
    { key: 'color', i18nKey: 'products.color', inputType: 'text' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  pet_shop: [
    { key: 'weight_kg', i18nKey: 'products.weight', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  services: [
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  laundry: [
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  pool: [
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  home_cleaning: [
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  printing: [
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  real_estate: [
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
    { key: 'size', i18nKey: 'products.surface', inputType: 'text' },
  ],

  bar: [
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],

  btp: [
    {
      key: 'vehicle_type',
      i18nKey: 'products.btpCategory',
      inputType: 'select',
      options: ['material', 'equipment', 'labor', 'subcontract', 'transport'],
    },
    { key: 'weight_kg', i18nKey: 'products.weight', inputType: 'number' },
    { key: 'duration_minutes', i18nKey: 'products.duration', inputType: 'number' },
    { key: 'description', i18nKey: 'products.description', inputType: 'text' },
  ],
}
