import { useState, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// useVirtualKeyboard — Manages virtual keyboard state for touch devices
// ---------------------------------------------------------------------------

export type VKMode = 'numeric' | 'alphanumeric'

export interface VKInputConfig {
  getValue: () => string
  setValue: (v: string) => void
  type: VKMode
}

export interface UseVirtualKeyboardReturn {
  isVisible: boolean
  mode: VKMode
  activeInputId: string | null
  toggleKeyboard: () => void
  showKeyboard: () => void
  hideKeyboard: () => void
  setMode: (m: VKMode) => void
  handleKeyPress: (key: string) => void
  handleBackspace: () => void
  handleClear: () => void
  handleConfirm: () => void
  onInputFocus: (inputId: string) => void
  registerInput: (id: string, config: VKInputConfig) => void
  unregisterInput: (id: string) => void
}

export function useVirtualKeyboard(): UseVirtualKeyboardReturn {
  const [isVisible, setIsVisible] = useState(false)
  const [mode, setMode] = useState<VKMode>('numeric')
  const [activeInputId, setActiveInputId] = useState<string | null>(null)
  const inputsRef = useRef<Map<string, VKInputConfig>>(new Map())

  const registerInput = useCallback((id: string, config: VKInputConfig) => {
    inputsRef.current.set(id, config)
  }, [])

  const unregisterInput = useCallback((id: string) => {
    inputsRef.current.delete(id)
  }, [])

  const getActiveConfig = useCallback((): VKInputConfig | null => {
    if (!activeInputId) return null
    return inputsRef.current.get(activeInputId) ?? null
  }, [activeInputId])

  const showKeyboard = useCallback(() => setIsVisible(true), [])
  const hideKeyboard = useCallback(() => {
    setIsVisible(false)
    setActiveInputId(null)
  }, [])
  const toggleKeyboard = useCallback(() => setIsVisible(v => !v), [])

  const onInputFocus = useCallback((inputId: string) => {
    setActiveInputId(inputId)
    const config = inputsRef.current.get(inputId)
    if (config) {
      setMode(config.type)
      setIsVisible(true)
    }
  }, [])

  const handleKeyPress = useCallback((key: string) => {
    const config = getActiveConfig()
    if (!config) return
    const current = config.getValue()
    config.setValue(current + key)
  }, [getActiveConfig])

  const handleBackspace = useCallback(() => {
    const config = getActiveConfig()
    if (!config) return
    const current = config.getValue()
    if (current.length > 0) {
      config.setValue(current.slice(0, -1))
    }
  }, [getActiveConfig])

  const handleClear = useCallback(() => {
    const config = getActiveConfig()
    if (!config) return
    config.setValue('')
  }, [getActiveConfig])

  const handleConfirm = useCallback(() => {
    setIsVisible(false)
    setActiveInputId(null)
  }, [])

  return {
    isVisible,
    mode,
    activeInputId,
    toggleKeyboard,
    showKeyboard,
    hideKeyboard,
    setMode,
    handleKeyPress,
    handleBackspace,
    handleClear,
    handleConfirm,
    onInputFocus,
    registerInput,
    unregisterInput,
  }
}
