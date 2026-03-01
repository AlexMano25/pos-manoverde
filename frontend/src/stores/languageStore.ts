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
          if (state?.language) {
            applyLanguageToDocument(state.language)
            // Restore t from the persisted language
            state.t = translations[state.language]
          }
        }
      },
    }
  )
)
