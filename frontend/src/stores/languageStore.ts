import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '../i18n/types'
import { DEFAULT_LANGUAGE, languages } from '../i18n/types'
import { translations } from '../i18n/translations'
import type { TranslationKeys } from '../i18n/translations'

// ── State ────────────────────────────────────────────────────────────────────

interface LanguageState {
  language: Language
}

// ── Actions ──────────────────────────────────────────────────────────────────

interface LanguageActions {
  setLanguage: (lang: Language) => void
}

// ── Computed ─────────────────────────────────────────────────────────────────

interface LanguageComputed {
  t: TranslationKeys
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function applyLanguageToDocument(lang: Language): void {
  const info = languages.find((l) => l.code === lang)
  if (!info) return

  document.documentElement.lang = lang
  document.documentElement.dir = info.dir
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useLanguageStore = create<LanguageState & LanguageActions & LanguageComputed>()(
  persist(
    (set, get) => ({
      // State
      language: DEFAULT_LANGUAGE,

      // Computed (evaluated on access via getter)
      get t(): TranslationKeys {
        return translations[get().language]
      },

      // Actions
      setLanguage: (lang: Language) => {
        applyLanguageToDocument(lang)
        set({ language: lang })
      },
    }),
    {
      name: 'pos-language-store',
      partialize: (state) => ({
        language: state.language,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Apply language to document when store rehydrates from localStorage
          if (state?.language) {
            applyLanguageToDocument(state.language)
          }
        }
      },
    }
  )
)
