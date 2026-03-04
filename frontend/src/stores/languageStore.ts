import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n/types'
import { DEFAULT_LANGUAGE, languages } from '../i18n/types'
import { translations } from '../i18n/translations'
import type { TranslationKeys } from '../i18n/translations'

// ── State ────────────────────────────────────────────────────────────────────

interface LanguageState {
  language: Language
  t: TranslationKeys
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface LanguageActions {
  setLanguage: (lang: Language) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyLanguageToDocument(lang: Language): void {
  const info = languages.find((l) => l.code === lang)
  if (!info) return

  document.documentElement.lang = lang
  document.documentElement.dir = info.dir
}

function detectBrowserLanguage(): Language {
  try {
    const browserLangs = navigator.languages?.length
      ? navigator.languages
      : [navigator.language]
    for (const browserLang of browserLangs) {
      const base = browserLang.split('-')[0].toLowerCase()
      const match = languages.find(l => l.code === base)
      if (match) return match.code as Language
    }
  } catch {
    // SSR or no navigator
  }
  return 'fr'
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useLanguageStore = create<LanguageState & LanguageActions>()(
  persist(
    (set) => ({
      // State
      language: DEFAULT_LANGUAGE,
      t: translations[DEFAULT_LANGUAGE],

      // Actions
      setLanguage: (lang: Language) => {
        applyLanguageToDocument(lang)
        set({ language: lang, t: translations[lang] })
      },
    }),
    {
      name: 'pos-language-store',
      partialize: (state) => ({
        language: state.language,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // First visit: no persisted language -> detect from browser
            const stored = localStorage.getItem('pos-language-store')
            if (!stored) {
              const detected = detectBrowserLanguage()
              state.language = detected
            }
            state.t = translations[state.language]
            // Apply to document
            const langInfo = languages.find(l => l.code === state.language)
            if (langInfo) {
              document.documentElement.lang = state.language
              document.documentElement.dir = langInfo.dir
            }
          }
        }
      },
    }
  )
)
