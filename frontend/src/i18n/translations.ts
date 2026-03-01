// ── Translation Barrel ────────────────────────────────────────────────────────
// Imports all locale files and exports the translations map.
// ──────────────────────────────────────────────────────────────────────────────

import type { Language } from './types'
import type { TranslationKeys } from './keys'
import { fr } from './locales/fr'
import { en } from './locales/en'
import { es } from './locales/es'
import { zh } from './locales/zh'
import { ar } from './locales/ar'
import { de } from './locales/de'
import { it } from './locales/it'

export type { TranslationKeys } from './keys'

export const translations: Record<Language, TranslationKeys> = {
  fr,
  en,
  es,
  zh,
  ar,
  de,
  it,
}
