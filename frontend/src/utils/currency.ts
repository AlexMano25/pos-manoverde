/**
 * Centralized currency formatting utility.
 *
 * Replaces all duplicated `formatFCFA()` functions across the codebase.
 * The currency code is read from the current store in appStore.
 */

// ── World currencies organized by region ───────────────────────────────────

export interface CurrencyInfo {
  code: string      // ISO 4217 code
  symbol: string    // Display symbol
  name: string      // English name
  locale: string    // Intl locale hint
  region: string    // Continent / region
}

export const WORLD_CURRENCIES: CurrencyInfo[] = [
  // Africa
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', locale: 'fr-CM', region: 'Africa' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', locale: 'fr-SN', region: 'Africa' },
  { code: 'NGN', symbol: '\u20A6', name: 'Nigerian Naira', locale: 'en-NG', region: 'Africa' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE', region: 'Africa' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', region: 'Africa' },
  { code: 'EGP', symbol: 'E\u00A3', name: 'Egyptian Pound', locale: 'ar-EG', region: 'Africa' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', locale: 'fr-MA', region: 'Africa' },
  { code: 'GHS', symbol: 'GH\u20B5', name: 'Ghanaian Cedi', locale: 'en-GH', region: 'Africa' },

  // Europe
  { code: 'EUR', symbol: '\u20AC', name: 'Euro', locale: 'fr-FR', region: 'Europe' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound', locale: 'en-GB', region: 'Europe' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'fr-CH', region: 'Europe' },

  // North America
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', region: 'North America' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA', region: 'North America' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', locale: 'es-MX', region: 'North America' },

  // South America
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR', region: 'South America' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', locale: 'es-AR', region: 'South America' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', locale: 'es-CO', region: 'South America' },

  // Asia
  { code: 'CNY', symbol: '\u00A5', name: 'Chinese Yuan', locale: 'zh-CN', region: 'Asia' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen', locale: 'ja-JP', region: 'Asia' },
  { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee', locale: 'en-IN', region: 'Asia' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', locale: 'ar-SA', region: 'Asia' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE', region: 'Asia' },
  { code: 'THB', symbol: '\u0E3F', name: 'Thai Baht', locale: 'th-TH', region: 'Asia' },

  // Oceania
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', region: 'Oceania' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ', region: 'Oceania' },
]

// ── Lookup by code ────────────────────────────────────────────────────────

const currencyMap = new Map<string, CurrencyInfo>()
for (const c of WORLD_CURRENCIES) currencyMap.set(c.code, c)

export function getCurrencyInfo(code: string): CurrencyInfo {
  return currencyMap.get(code) || { code, symbol: code, name: code, locale: 'en-US', region: 'Other' }
}

// ── Centralized formatter ─────────────────────────────────────────────────

/**
 * Format an amount with the given currency code.
 *
 * @param amount   Numeric value
 * @param currency ISO 4217 currency code (default: 'XAF')
 * @param locale   Optional Intl locale override
 * @returns        Formatted string like "1 234 567 FCFA" or "$1,234"
 */
export function formatCurrency(amount: number, currency = 'XAF', locale?: string): string {
  const info = getCurrencyInfo(currency)
  const resolvedLocale = locale || info.locale

  // For CFA-style currencies, append the symbol after the number
  if (currency === 'XAF' || currency === 'XOF') {
    return new Intl.NumberFormat(resolvedLocale).format(amount) + ' ' + info.symbol
  }

  // For most currencies, try Intl.NumberFormat with currency style
  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount)
  } catch {
    // Fallback: number + symbol
    return new Intl.NumberFormat(resolvedLocale).format(amount) + ' ' + info.symbol
  }
}

/**
 * Simple format for PDF / receipt (no Intl, safe for jsPDF).
 * Always appends the currency symbol after the number.
 */
export function formatCurrencyPlain(amount: number, currency = 'XAF'): string {
  const info = getCurrencyInfo(currency)
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} ${info.symbol}`
}

/**
 * Get the currency symbol for a given code.
 */
export function getCurrencySymbol(currency = 'XAF'): string {
  return getCurrencyInfo(currency).symbol
}
