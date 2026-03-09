import React, { useState, useEffect } from 'react'
import {
  Store,
  Wifi,
  WifiOff,
  Printer,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  Bluetooth,
  BluetoothOff,
  BluetoothSearching,
  DollarSign,
  AlertTriangle,
  Receipt,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useSyncStore } from '../stores/syncStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import { useBluetooth } from '../hooks/useBluetooth'
import { ESCPOSEncoder, bluetoothPrinter } from '../services/bluetooth'
import { getDeviceId } from '../db/dexie'
import { isServerReachable } from '../services/api'
import QRCodeDisplay from '../components/common/QRCodeDisplay'
import DataManagementSection from '../components/settings/DataManagementSection'
import { WORLD_CURRENCIES } from '../utils/currency'
import { getReceiptCounterState, resetReceiptCounter } from '../utils/receiptCounter'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
} as const

// ── Component ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const {
    currentStore,
    serverUrl,
    connectionStatus,
    mode,
    setServerUrl,
    setConnectionStatus,
    setCurrentStore,
  } = useAppStore()

  const {
    pendingCount,
    lastSyncAt,
    isSyncing,
    countPending,
    syncToServer,
  } = useSyncStore()

  const { t, language } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  // Store info form
  const [storeName, setStoreName] = useState(currentStore?.name || '')
  const [storeAddress, setStoreAddress] = useState(currentStore?.address || '')
  const [storePhone, setStorePhone] = useState(currentStore?.phone || '')
  const [storeSaved, setStoreSaved] = useState(false)

  // Receipt settings
  const [receiptPrefix, setReceiptPrefix] = useState(currentStore?.receipt_prefix || 'MV')
  const [receiptSaved, setReceiptSaved] = useState(false)

  // Currency
  const [storeCurrency, setStoreCurrency] = useState(currentStore?.currency || 'XAF')
  const [customCurrency, setCustomCurrency] = useState('')
  const [currencySaved, setCurrencySaved] = useState(false)

  // Connection
  const [serverUrlInput, setServerUrlInput] = useState(serverUrl || '')
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<'success' | 'error' | null>(null)

  // Device
  const deviceId = getDeviceId()

  // Bluetooth printer
  const {
    printerStatus,
    printerName,
    isSupported: btSupported,
    scanAndConnect,
    disconnect: btDisconnect,
    openCashDrawer,
    error: btError,
  } = useBluetooth()

  useEffect(() => {
    countPending()
  }, [countPending])

  useEffect(() => {
    setStoreName(currentStore?.name || '')
    setStoreAddress(currentStore?.address || '')
    setStorePhone(currentStore?.phone || '')
    setStoreCurrency(currentStore?.currency || 'XAF')
  }, [currentStore])

  const handleSaveStore = () => {
    if (!currentStore) return
    const updated = {
      ...currentStore,
      name: storeName.trim(),
      address: storeAddress.trim(),
      phone: storePhone.trim(),
      updated_at: new Date().toISOString(),
    }
    setCurrentStore(updated)
    setStoreSaved(true)
    setTimeout(() => setStoreSaved(false), 2000)
  }

  const handleSaveCurrency = () => {
    if (!currentStore) return
    const currencyCode = storeCurrency === 'custom' ? customCurrency.trim() || 'XAF' : storeCurrency
    const updated = {
      ...currentStore,
      currency: currencyCode,
      updated_at: new Date().toISOString(),
    }
    setCurrentStore(updated)
    setCurrencySaved(true)
    setTimeout(() => setCurrencySaved(false), 2000)
  }

  const handleSaveServerUrl = () => {
    const cleaned = serverUrlInput.replace(/\/+$/, '')
    setServerUrl(cleaned)
    setConnectionResult(null)
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionResult(null)
    try {
      const reachable = await isServerReachable()
      setConnectionResult(reachable ? 'success' : 'error')
      setConnectionStatus(reachable ? 'online' : 'offline')
    } catch {
      setConnectionResult('error')
      setConnectionStatus('offline')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSync = async () => {
    await syncToServer()
    await countPending()
  }

  const handlePrinterTest = async () => {
    if (!bluetoothPrinter.isConnected()) return
    const E = ESCPOSEncoder
    try {
      const data = E.concat([
        E.initialize(),
        E.setAlign('center'),
        E.setBold(true),
        E.text(currentStore?.name || 'POS Mano Verde'),
        E.newline(),
        E.setBold(false),
        E.separator(),
        E.text('Test impression'),
        E.newline(),
        E.text(new Date().toLocaleString(locale)),
        E.newline(),
        E.newline(),
        E.cut(),
      ])
      await bluetoothPrinter.write(data)
    } catch (err) {
      console.error('Test print failed:', err)
    }
  }

  const locale = language === 'ar' ? 'ar-SA' : language === 'zh' ? 'zh-CN' : language === 'de' ? 'de-DE' : language === 'it' ? 'it-IT' : language === 'es' ? 'es-ES' : language === 'en' ? 'en-US' : 'fr-FR'

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(12, 20, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: rv(20, 22, 24),
    fontWeight: 700,
    color: C.text,
    margin: '0 0 24px',
  }

  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(16, 20, 24),
    marginBottom: rv(14, 18, 20),
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  }

  const sectionIconStyle = (color: string): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: color + '15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  })

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: C.text,
    margin: 0,
  }

  const sectionDescStyle: React.CSSProperties = {
    fontSize: 13,
    color: C.textSecondary,
    margin: 0,
  }

  const fieldStyle: React.CSSProperties = {
    marginBottom: 14,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    marginBottom: 6,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const inputRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: 8,
    alignItems: isMobile ? 'stretch' : 'flex-end',
  }

  const primaryBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: C.primary,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const outlineBtnStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  }

  const successBtnStyle: React.CSSProperties = {
    ...primaryBtnStyle,
    backgroundColor: C.success,
  }

  const statusBadgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color,
    backgroundColor: color + '10',
  })

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 4 : 8,
    padding: '10px 0',
    borderBottom: `1px solid ${C.border}`,
  }

  const infoLabelStyle: React.CSSProperties = {
    fontSize: 14,
    color: C.textSecondary,
  }

  const infoValueStyle: React.CSSProperties = {
    fontSize: 14,
    color: C.text,
    fontWeight: 500,
    fontFamily: 'monospace',
  }

  const connectionStatusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    online: { label: t.sync.online, color: C.success, icon: <Wifi size={14} /> },
    offline: { label: t.sync.offline, color: C.danger, icon: <WifiOff size={14} /> },
    'local-only': { label: t.sync.localOnly, color: C.warning, icon: <WifiOff size={14} /> },
  }

  const currentConnectionStatus = connectionStatusMap[connectionStatus] || connectionStatusMap['offline']

  // Build server URL for QR code
  const qrUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : '')

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>{t.settings.title}</h1>

      {/* ── Store Info ──────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(C.primary)}>
            <Store size={18} color={C.primary} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>{t.settings.storeInfo}</h3>
            <p style={sectionDescStyle}>{t.settings.storeInfoDesc}</p>
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>{t.setup.storeName}</label>
          <input
            style={inputStyle}
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            disabled={mode !== 'server' && mode !== 'all_in_one'}
            placeholder="Mano Verde SA"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>{t.common.address}</label>
          <input
            style={inputStyle}
            type="text"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            disabled={mode !== 'server' && mode !== 'all_in_one'}
            placeholder="Rue de la Joie, Douala"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>{t.common.phone}</label>
          <input
            style={inputStyle}
            type="tel"
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            disabled={mode !== 'server' && mode !== 'all_in_one'}
            placeholder="+237 6XX XXX XXX"
          />
        </div>

        {(mode === 'server' || mode === 'all_in_one') && (
          <button
            style={storeSaved ? successBtnStyle : primaryBtnStyle}
            onClick={handleSaveStore}
          >
            {storeSaved ? (
              <><CheckCircle2 size={16} /> {t.common.success}</>
            ) : (
              <><Save size={16} /> {t.common.save}</>
            )}
          </button>
        )}

        {mode === 'client' && (
          <p style={{ fontSize: 12, color: C.textSecondary, margin: '8px 0 0', fontStyle: 'italic' }}>
            {t.employees.serverModeMessage}
          </p>
        )}
      </div>

      {/* ── Currency ──────────────────────────────────────────────── */}
      {(mode === 'server' || mode === 'all_in_one') && (
        <div style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div style={sectionIconStyle('#f59e0b')}>
              <DollarSign size={18} color="#f59e0b" />
            </div>
            <div>
              <h3 style={sectionTitleStyle}>{t.settings.currency}</h3>
              <p style={sectionDescStyle}>{t.settings.currencyDesc}</p>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t.settings.currencyLabel}</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={storeCurrency}
              onChange={(e) => setStoreCurrency(e.target.value)}
            >
              {WORLD_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} — {c.name} ({c.code})
                </option>
              ))}
              <option value="custom">{t.settings.currencyCustom}</option>
            </select>
          </div>

          {storeCurrency === 'custom' && (
            <div style={fieldStyle}>
              <label style={labelStyle}>{t.settings.currencyCustom}</label>
              <input
                style={inputStyle}
                type="text"
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = C.primary)}
                onBlur={(e) => (e.target.style.borderColor = C.border)}
                placeholder="e.g. FCFA, $, €"
                maxLength={10}
              />
            </div>
          )}

          <button
            style={currencySaved ? successBtnStyle : primaryBtnStyle}
            onClick={handleSaveCurrency}
          >
            {currencySaved ? (
              <><CheckCircle2 size={16} /> {t.common.success}</>
            ) : (
              <><Save size={16} /> {t.common.save}</>
            )}
          </button>
        </div>
      )}

      {/* ── Connection ─────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(currentConnectionStatus.color)}>
            {connectionStatus === 'online' ? <Wifi size={18} color={C.success} /> : <WifiOff size={18} color={C.danger} />}
          </div>
          <div>
            <h3 style={sectionTitleStyle}>{t.settings.connection}</h3>
            <p style={sectionDescStyle}>{t.settings.connectionDesc}</p>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <span style={statusBadgeStyle(currentConnectionStatus.color)}>
            {currentConnectionStatus.icon}
            {currentConnectionStatus.label}
          </span>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>{t.auth.serverUrl}</label>
          <div style={inputRowStyle}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              type="url"
              value={serverUrlInput}
              onChange={(e) => setServerUrlInput(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.primary)}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
              placeholder="http://192.168.1.100:3000/api"
            />
            <button style={outlineBtnStyle} onClick={handleSaveServerUrl}>
              <Save size={14} /> {t.common.save}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            style={primaryBtnStyle}
            onClick={handleTestConnection}
            disabled={testingConnection}
          >
            {testingConnection ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t.common.loading}</>
            ) : (
              <><Wifi size={16} /> {t.auth.testConnection}</>
            )}
          </button>

          {connectionResult === 'success' && (
            <span style={statusBadgeStyle(C.success)}>
              <CheckCircle2 size={14} /> {t.auth.connectionSuccess}
            </span>
          )}
          {connectionResult === 'error' && (
            <span style={statusBadgeStyle(C.danger)}>
              <XCircle size={14} /> {t.auth.connectionFailed}
            </span>
          )}
        </div>
      </div>

      {/* ── QR Code (Server and All-in-One modes) ─────────────────────── */}
      {(mode === 'server' || mode === 'all_in_one') && qrUrl && (
        <div style={sectionCardStyle}>
          <QRCodeDisplay url={qrUrl} />
        </div>
      )}

      {/* ── Printer ────────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(
            printerStatus === 'connected' ? C.success :
            printerStatus === 'error' ? C.danger : '#8b5cf6'
          )}>
            <Printer size={18} color={
              printerStatus === 'connected' ? C.success :
              printerStatus === 'error' ? C.danger : '#8b5cf6'
            } />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>{t.settings.printer}</h3>
            <p style={sectionDescStyle}>{t.settings.printerDesc}</p>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {printerStatus === 'connected' && (
            <span style={statusBadgeStyle(C.success)}>
              <Bluetooth size={14} /> {t.settings.printerConnected}
              {printerName && ` — ${printerName}`}
            </span>
          )}
          {printerStatus === 'disconnected' && (
            <span style={statusBadgeStyle(C.textSecondary)}>
              <BluetoothOff size={14} /> {t.settings.printerDisconnected}
            </span>
          )}
          {printerStatus === 'printing' && (
            <span style={statusBadgeStyle(C.primary)}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t.printer.printing}
            </span>
          )}
          {printerStatus === 'error' && (
            <span style={statusBadgeStyle(C.danger)}>
              <XCircle size={14} /> {t.printer.error}
            </span>
          )}
        </div>

        {/* Error message */}
        {btError && (
          <div style={{
            marginTop: 10,
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: C.danger + '10',
            color: C.danger,
            fontSize: 13,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{btError}</span>
          </div>
        )}

        {/* Not supported banner */}
        {!btSupported && (
          <div style={{
            marginTop: 10,
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: C.warning + '10',
            color: '#92400e',
            fontSize: 13,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{t.printer.notSupported}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {printerStatus !== 'connected' ? (
            <button
              style={{ ...primaryBtnStyle, opacity: !btSupported ? 0.5 : 1 }}
              onClick={scanAndConnect}
              disabled={!btSupported || printerStatus === 'printing'}
            >
              <BluetoothSearching size={16} /> {t.printer.scanButton}
            </button>
          ) : (
            <>
              <button style={outlineBtnStyle} onClick={btDisconnect}>
                <BluetoothOff size={16} /> {t.printer.disconnectButton}
              </button>
              <button style={outlineBtnStyle} onClick={handlePrinterTest}>
                <Printer size={16} /> {t.printer.testButton}
              </button>
              <button style={outlineBtnStyle} onClick={openCashDrawer}>
                <DollarSign size={16} /> {t.printer.openDrawer}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Sync ───────────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(C.warning)}>
            <RefreshCw size={18} color={C.warning} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>{t.settings.sync}</h3>
            <p style={sectionDescStyle}>{t.settings.syncDesc}</p>
          </div>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>{t.settings.pendingItems}</span>
          <span style={{
            ...infoValueStyle,
            color: pendingCount > 0 ? C.warning : C.success,
            fontFamily: 'inherit',
            fontWeight: 700,
          }}>
            {pendingCount}
          </span>
        </div>

        <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
          <span style={infoLabelStyle}>{t.settings.lastSync}</span>
          <span style={{ ...infoValueStyle, fontFamily: 'inherit' }}>
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleString(locale)
              : t.settings.never}
          </span>
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            style={primaryBtnStyle}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t.sync.syncing}</>
            ) : (
              <><RefreshCw size={16} /> {t.settings.syncNow}</>
            )}
          </button>
        </div>
      </div>

      {/* ── Receipt Settings ────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle('#7c3aed')}>
            <Receipt size={18} color="#7c3aed" />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>
              {(t.settings as Record<string, string>).receiptSettings || 'Paramètres reçu'}
            </h3>
            <p style={sectionDescStyle}>
              {(t.settings as Record<string, string>).receiptSettingsDesc || 'Préfixe et numérotation des tickets'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4, display: 'block' }}>
              {(t.settings as Record<string, string>).receiptPrefix || 'Préfixe reçu'}
            </label>
            <div style={inputRowStyle}>
              <input
                style={{ ...inputStyle, maxWidth: 120 }}
                value={receiptPrefix}
                onChange={e => setReceiptPrefix(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="MV"
                maxLength={6}
              />
              <button
                style={receiptSaved ? successBtnStyle : primaryBtnStyle}
                onClick={() => {
                  if (currentStore) {
                    setCurrentStore({ ...currentStore, receipt_prefix: receiptPrefix })
                    setReceiptSaved(true)
                    setTimeout(() => setReceiptSaved(false), 2000)
                  }
                }}
              >
                {receiptSaved ? (
                  <><CheckCircle2 size={16} /> {t.common.success}</>
                ) : (
                  <><Save size={16} /> {t.common.save}</>
                )}
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.textSecondary, margin: '4px 0 0' }}>
              {(t.settings as Record<string, string>).receiptPrefixHint || `Format: ${receiptPrefix || 'MV'}-20260309-0001`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${C.border}` }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                {(t.settings as Record<string, string>).receiptCounter || 'Compteur du jour'}
              </span>
              <span style={{ fontSize: 13, color: C.textSecondary, marginLeft: 8 }}>
                {currentStore?.id ? (() => {
                  const state = getReceiptCounterState(currentStore.id)
                  return state ? `#${state.seq}` : '#0'
                })() : '#0'}
              </span>
            </div>
            <button
              style={{ ...outlineBtnStyle, padding: '6px 12px', fontSize: 12 }}
              onClick={() => {
                if (currentStore?.id && confirm((t.settings as Record<string, string>).receiptResetConfirm || 'Réinitialiser le compteur ?')) {
                  resetReceiptCounter(currentStore.id)
                  // Force re-render
                  setReceiptSaved(prev => !prev)
                  setTimeout(() => setReceiptSaved(false), 100)
                }
              }}
            >
              <RefreshCw size={12} /> {(t.settings as Record<string, string>).resetCounter || 'Réinitialiser'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Data Management (Admin only) ─────────────────────────── */}
      <DataManagementSection />

      {/* ── About ──────────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(C.textSecondary)}>
            <Info size={18} color={C.textSecondary} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>{t.settings.about}</h3>
            <p style={sectionDescStyle}>{t.settings.aboutDesc}</p>
          </div>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Application</span>
          <span style={{ ...infoValueStyle, fontFamily: 'inherit' }}>POS Mano Verde</span>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>{t.common.version}</span>
          <span style={infoValueStyle}>1.0.0</span>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>{t.settings.mode}</span>
          <span style={{ ...infoValueStyle, fontFamily: 'inherit' }}>
            {mode === 'server' ? t.setup.serverMode : mode === 'all_in_one' ? t.setup.allInOne : t.setup.clientMode}
          </span>
        </div>

        <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
          <span style={infoLabelStyle}>{t.settings.deviceId}</span>
          <span style={{ ...infoValueStyle, fontSize: 12 }}>
            {deviceId}
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
