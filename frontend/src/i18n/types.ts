// ── Language Types ─────────────────────────────────────────────────────────────

export type Language = 'fr' | 'en' | 'es' | 'zh' | 'ar' | 'de' | 'it'

export type LanguageInfo = {
  code: Language
  name: string
  nativeName: string
  flag: string
  dir: 'ltr' | 'rtl'
}

// ── Supported Languages ───────────────────────────────────────────────────────

export const languages: LanguageInfo[] = [
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
]

export const DEFAULT_LANGUAGE: Language = 'fr'
