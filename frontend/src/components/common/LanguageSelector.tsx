import { useState, useRef, useEffect, useCallback } from 'react'
import { useLanguageStore } from '../../stores/languageStore'
import { languages } from '../../i18n/types'
import type { Language } from '../../i18n/types'

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    position: 'relative' as const,
    display: 'inline-block',
  },

  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '13px',
    fontWeight: 500 as const,
    transition: 'all 0.2s ease',
    outline: 'none',
    whiteSpace: 'nowrap' as const,
  },

  buttonHover: {
    background: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  flag: {
    fontSize: '16px',
    lineHeight: 1,
  },

  code: {
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontSize: '11px',
    fontWeight: 600 as const,
  },

  chevron: {
    fontSize: '10px',
    opacity: 0.6,
    transition: 'transform 0.2s ease',
  },

  chevronOpen: {
    transform: 'rotate(180deg)',
  },

  dropdown: {
    position: 'absolute' as const,
    bottom: 'calc(100% + 6px)',
    left: '0',
    minWidth: '200px',
    background: '#1e1e2e',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    zIndex: 9999,
    padding: '4px',
  },

  dropdownEnter: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  },

  dropdownExit: {
    opacity: 0,
    transform: 'translateY(8px) scale(0.96)',
    transition: 'all 0.15s ease-in',
    pointerEvents: 'none' as const,
  },

  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'background 0.15s ease',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '13px',
    outline: 'none',
  },

  optionHover: {
    background: 'rgba(255, 255, 255, 0.08)',
  },

  optionActive: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
  },

  optionFlag: {
    fontSize: '18px',
    lineHeight: 1,
    flexShrink: 0,
  },

  optionTextGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    minWidth: 0,
  },

  optionNativeName: {
    fontWeight: 500 as const,
    fontSize: '13px',
    lineHeight: 1.3,
  },

  optionCode: {
    fontSize: '11px',
    opacity: 0.5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  checkmark: {
    fontSize: '14px',
    color: '#a5b4fc',
    flexShrink: 0,
  },
} as const

// ── Component ─────────────────────────────────────────────────────────────────

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore()
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find((l) => l.code === language) ?? languages[0]

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        closeDropdown()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const openDropdown = useCallback(() => {
    setIsOpen(true)
    // Trigger enter animation on next frame
    requestAnimationFrame(() => {
      setIsAnimating(true)
    })
  }, [])

  const closeDropdown = useCallback(() => {
    setIsAnimating(false)
    // Wait for exit animation to finish before unmounting
    setTimeout(() => {
      setIsOpen(false)
    }, 150)
  }, [])

  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }, [isOpen, closeDropdown, openDropdown])

  const selectLanguage = useCallback(
    (lang: Language) => {
      setLanguage(lang)
      closeDropdown()
    },
    [setLanguage, closeDropdown]
  )

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        style={{
          ...styles.button,
          ...(isButtonHovered ? styles.buttonHover : {}),
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Language: ${currentLang.nativeName}`}
      >
        <span style={styles.flag}>{currentLang.flag}</span>
        <span style={styles.code}>{currentLang.code}</span>
        <span
          style={{
            ...styles.chevron,
            ...(isOpen ? styles.chevronOpen : {}),
          }}
        >
          &#9650;
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select language"
          style={{
            ...styles.dropdown,
            ...(isAnimating ? styles.dropdownEnter : styles.dropdownExit),
          }}
        >
          {languages.map((lang, index) => {
            const isActive = lang.code === language
            const isHovered = hoveredIndex === index

            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => selectLanguage(lang.code)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  ...styles.option,
                  ...(isActive ? styles.optionActive : {}),
                  ...(isHovered && !isActive ? styles.optionHover : {}),
                }}
              >
                <span style={styles.optionFlag}>{lang.flag}</span>
                <span style={styles.optionTextGroup}>
                  <span style={styles.optionNativeName}>{lang.nativeName}</span>
                  <span style={styles.optionCode}>{lang.code}</span>
                </span>
                {isActive && <span style={styles.checkmark}>&#10003;</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
