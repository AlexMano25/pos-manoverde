import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Store, Eye, EyeOff, ChevronDown, ChevronUp, Loader2, Globe } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { goToLanding } from '../utils/navigation'

type TabKey = 'email' | 'pin'

export default function LoginPage() {
  // Pre-fill email from URL params (shared employee link)
  const urlEmail = new URLSearchParams(window.location.search).get('email') || ''
  const [activeTab, setActiveTab] = useState<TabKey>(urlEmail ? 'email' : 'email')
  const [email, setEmail] = useState(urlEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [serverUrlInput, setServerUrlInput] = useState('')

  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const login = useAuthStore((s) => s.login)
  const loginWithPin = useAuthStore((s) => s.loginWithPin)
  const user = useAuthStore((s) => s.user)
  const { serverUrl, setServerUrl, setSection, mode, setShowLogin, setRegistrationMode } = useAppStore()
  const { t } = useLanguageStore()

  useEffect(() => {
    setServerUrlInput(serverUrl || '')
  }, [serverUrl])

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      setShowLogin(false)
      if (user.role === 'admin' || user.role === 'manager') {
        setSection('dashboard')
      } else {
        setSection('pos')
      }
    }
  }, [user, setSection, setShowLogin])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(t.common.required)
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.connectionFailed)
    } finally {
      setLoading(false)
    }
  }

  const handlePinSubmit = useCallback(async (fullPin: string) => {
    setLoading(true)
    setError('')
    try {
      await loginWithPin(fullPin)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.invalidCredentials)
      setPin(['', '', '', ''])
      pinRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [loginWithPin, t.auth.invalidCredentials])

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const digit = value.slice(-1)
    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)
    setError('')

    if (digit && index < 3) {
      pinRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3 && newPin.every((d) => d !== '')) {
      handlePinSubmit(newPin.join(''))
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus()
    }
  }

  const handleSaveServerUrl = () => {
    const cleaned = serverUrlInput.replace(/\/+$/, '')
    setServerUrl(cleaned)
    setShowSettings(false)
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
  }

  const brandingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '32px 24px 24px',
  }

  const logoContainerStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  }

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid #e2e8f0',
    margin: '0 24px',
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? '#2563eb' : '#64748b',
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
    transition: 'all 0.2s',
  })

  const formStyle: React.CSSProperties = {
    padding: '24px',
  }

  const fieldStyle: React.CSSProperties = {
    marginBottom: 16,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#1e293b',
    marginBottom: 6,
  }

  const inputContainerStyle: React.CSSProperties = {
    position: 'relative',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const eyeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  }

  const pinContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  }

  const pinInputStyle: React.CSSProperties = {
    width: 56,
    height: 64,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 700,
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    outline: 'none',
    color: '#1e293b',
    transition: 'border-color 0.2s',
  }

  const errorStyle: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background-color 0.2s',
    opacity: loading ? 0.7 : 1,
  }

  const settingsToggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '12px 24px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    color: '#94a3b8',
    width: '100%',
  }

  const settingsBoxStyle: React.CSSProperties = {
    padding: '0 24px 20px',
  }

  const settingsInputRow: React.CSSProperties = {
    display: 'flex',
    gap: 8,
  }

  const saveButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        {/* Back to website link */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <button
            onClick={() => { setShowLogin(false); goToLanding() }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
            }}
          >
            <Globe size={14} />
            {t.setup.backToWebsite}
          </button>
        </div>

        <div style={cardStyle}>
          {/* Branding */}
          <div style={brandingStyle}>
            <div style={logoContainerStyle}>
              <Store size={32} color="#ffffff" />
            </div>
            <h1 style={titleStyle}>POS Mano Verde</h1>
            <p style={subtitleStyle}>{t.auth.loginSubtitle}</p>
          </div>

          {/* Tabs */}
          <div style={tabsContainerStyle}>
            <button
              style={tabStyle(activeTab === 'email')}
              onClick={() => { setActiveTab('email'); setError('') }}
            >
              {t.auth.emailLogin}
            </button>
            <button
              style={tabStyle(activeTab === 'pin')}
              onClick={() => { setActiveTab('pin'); setError('') }}
            >
              {t.auth.pinLogin}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '16px 24px 0' }}>
              <div style={errorStyle}>{error}</div>
            </div>
          )}

          {/* Email / Password Form */}
          {activeTab === 'email' && (
            <form style={formStyle} onSubmit={handleEmailLogin}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t.auth.emailLabel}</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t.auth.passwordLabel}</label>
                <div style={inputContainerStyle}>
                  <input
                    style={{ ...inputStyle, paddingRight: 40 }}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    style={eyeButtonStyle}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" style={buttonStyle} disabled={loading}>
                {loading && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? t.auth.loggingIn : t.auth.loginButton}
              </button>
            </form>
          )}

          {/* PIN Form */}
          {activeTab === 'pin' && (
            <div style={formStyle}>
              <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 24, marginTop: 0 }}>
                {t.auth.pinLabel}
              </p>
              <div style={pinContainerStyle}>
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { pinRefs.current[i] = el }}
                    style={{
                      ...pinInputStyle,
                      borderColor: digit ? '#2563eb' : '#e2e8f0',
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                    onBlur={(e) => (e.target.style.borderColor = digit ? '#2563eb' : '#e2e8f0')}
                    disabled={loading}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {loading && (
                <div style={{ textAlign: 'center', color: '#2563eb' }}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
          )}

          {/* Create account link */}
          <div style={{ textAlign: 'center', padding: '12px 0 4px', borderTop: '1px solid #e2e8f0', marginTop: 8 }}>
            <span style={{ color: '#64748b', fontSize: 13 }}>
              {t.auth.noAccount}{' '}
            </span>
            <button
              onClick={() => {
                setShowLogin(false)
                setRegistrationMode(true)
                const appStore = useAppStore.getState()
                appStore.setSelectedPlan('free')
                localStorage.setItem('pos-app-store', JSON.stringify({
                  state: { mode: 'all_in_one', activity: null, serverUrl: '', selectedPlan: 'free', registrationMode: true, showLogin: false },
                  version: 0,
                }))
                window.location.reload()
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#2563eb',
                fontSize: 13,
                fontWeight: 600,
                padding: 0,
              }}
            >
              {t.auth.createAccount}
            </button>
          </div>

          {/* Server Settings (hidden in all_in_one mode) */}
          {mode !== 'all_in_one' && (
            <>
              <button style={settingsToggleStyle} onClick={() => setShowSettings(!showSettings)}>
                {t.auth.serverSettings}
                {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showSettings && (
                <div style={settingsBoxStyle}>
                  <label style={{ ...labelStyle, marginBottom: 6 }}>{t.auth.serverUrl}</label>
                  <div style={settingsInputRow}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      type="url"
                      placeholder="http://192.168.1.100:3000/api"
                      value={serverUrlInput}
                      onChange={(e) => setServerUrlInput(e.target.value)}
                      onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                      onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                    />
                    <button style={saveButtonStyle} onClick={handleSaveServerUrl}>
                      {t.common.save}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Spinner animation keyframes injected into head */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
