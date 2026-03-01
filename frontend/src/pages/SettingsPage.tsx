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
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useSyncStore } from '../stores/syncStore'
import { getDeviceId } from '../db/dexie'
import { isServerReachable } from '../services/api'

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

  // Store info form
  const [storeName, setStoreName] = useState(currentStore?.name || '')
  const [storeAddress, setStoreAddress] = useState(currentStore?.address || '')
  const [storePhone, setStorePhone] = useState(currentStore?.phone || '')
  const [storeSaved, setStoreSaved] = useState(false)

  // Connection
  const [serverUrlInput, setServerUrlInput] = useState(serverUrl || '')
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<'success' | 'error' | null>(null)

  // Device
  const deviceId = getDeviceId()

  useEffect(() => {
    countPending()
  }, [countPending])

  useEffect(() => {
    setStoreName(currentStore?.name || '')
    setStoreAddress(currentStore?.address || '')
    setStorePhone(currentStore?.phone || '')
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

  const handlePrinterTest = () => {
    alert('Test d\'impression - Fonctionnalite bientot disponible. Assurez-vous que votre imprimante Bluetooth est connectee.')
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: 24,
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: C.text,
    margin: '0 0 24px',
  }

  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: 24,
    marginBottom: 20,
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
    gap: 8,
    alignItems: 'flex-end',
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
    alignItems: 'center',
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
    online: { label: 'Connecte', color: C.success, icon: <Wifi size={14} /> },
    offline: { label: 'Hors ligne', color: C.danger, icon: <WifiOff size={14} /> },
    'local-only': { label: 'Mode local', color: C.warning, icon: <WifiOff size={14} /> },
  }

  const currentConnectionStatus = connectionStatusMap[connectionStatus] || connectionStatusMap['offline']

  return (
    <div style={pageStyle}>
      <h1 style={titleStyle}>Parametres</h1>

      {/* ── Store Info ──────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(C.primary)}>
            <Store size={18} color={C.primary} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>Informations du magasin</h3>
            <p style={sectionDescStyle}>Nom, adresse et telephone du magasin</p>
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Nom du magasin</label>
          <input
            style={inputStyle}
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            disabled={mode === 'client'}
            placeholder="Mano Verde SA"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Adresse</label>
          <input
            style={inputStyle}
            type="text"
            value={storeAddress}
            onChange={(e) => setStoreAddress(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            disabled={mode === 'client'}
            placeholder="Rue de la Joie, Douala"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Telephone</label>
          <input
            style={inputStyle}
            type="tel"
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            disabled={mode === 'client'}
            placeholder="+237 6XX XXX XXX"
          />
        </div>

        {mode === 'server' && (
          <button
            style={storeSaved ? successBtnStyle : primaryBtnStyle}
            onClick={handleSaveStore}
          >
            {storeSaved ? (
              <><CheckCircle2 size={16} /> Sauvegarde !</>
            ) : (
              <><Save size={16} /> Sauvegarder</>
            )}
          </button>
        )}

        {mode === 'client' && (
          <p style={{ fontSize: 12, color: C.textSecondary, margin: '8px 0 0', fontStyle: 'italic' }}>
            Les informations du magasin sont gerees par le serveur.
          </p>
        )}
      </div>

      {/* ── Connection ─────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(currentConnectionStatus.color)}>
            {connectionStatus === 'online' ? <Wifi size={18} color={C.success} /> : <WifiOff size={18} color={C.danger} />}
          </div>
          <div>
            <h3 style={sectionTitleStyle}>Connexion</h3>
            <p style={sectionDescStyle}>Configuration du serveur backend</p>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <span style={statusBadgeStyle(currentConnectionStatus.color)}>
            {currentConnectionStatus.icon}
            {currentConnectionStatus.label}
          </span>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>URL du serveur</label>
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
              <Save size={14} /> Sauver
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
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Test en cours...</>
            ) : (
              <><Wifi size={16} /> Tester la connexion</>
            )}
          </button>

          {connectionResult === 'success' && (
            <span style={statusBadgeStyle(C.success)}>
              <CheckCircle2 size={14} /> Connexion reussie
            </span>
          )}
          {connectionResult === 'error' && (
            <span style={statusBadgeStyle(C.danger)}>
              <XCircle size={14} /> Connexion echouee
            </span>
          )}
        </div>
      </div>

      {/* ── Printer ────────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle('#8b5cf6')}>
            <Printer size={18} color="#8b5cf6" />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>Imprimante</h3>
            <p style={sectionDescStyle}>Configuration de l'imprimante thermique Bluetooth</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={statusBadgeStyle(C.textSecondary)}>
            <Bluetooth size={14} /> Non connectee
          </span>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button style={outlineBtnStyle} onClick={() => alert('Recherche d\'imprimante Bluetooth - Bientot disponible')}>
            <Bluetooth size={16} /> Rechercher
          </button>
          <button style={outlineBtnStyle} onClick={handlePrinterTest}>
            <Printer size={16} /> Test d'impression
          </button>
        </div>
      </div>

      {/* ── Sync ───────────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(C.warning)}>
            <RefreshCw size={18} color={C.warning} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>Synchronisation</h3>
            <p style={sectionDescStyle}>Gestion de la synchronisation des donnees</p>
          </div>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Operations en attente</span>
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
          <span style={infoLabelStyle}>Derniere synchronisation</span>
          <span style={{ ...infoValueStyle, fontFamily: 'inherit' }}>
            {lastSyncAt
              ? new Date(lastSyncAt).toLocaleString('fr-FR')
              : 'Jamais'}
          </span>
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            style={primaryBtnStyle}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Synchronisation...</>
            ) : (
              <><RefreshCw size={16} /> Synchroniser maintenant</>
            )}
          </button>
        </div>
      </div>

      {/* ── About ──────────────────────────────────────────────────── */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={sectionIconStyle(C.textSecondary)}>
            <Info size={18} color={C.textSecondary} />
          </div>
          <div>
            <h3 style={sectionTitleStyle}>A propos</h3>
            <p style={sectionDescStyle}>Informations sur l'application</p>
          </div>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Application</span>
          <span style={{ ...infoValueStyle, fontFamily: 'inherit' }}>POS Mano Verde</span>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Version</span>
          <span style={infoValueStyle}>1.0.0</span>
        </div>

        <div style={infoRowStyle}>
          <span style={infoLabelStyle}>Mode</span>
          <span style={{ ...infoValueStyle, fontFamily: 'inherit' }}>
            {mode === 'server' ? 'Serveur' : 'Client'}
          </span>
        </div>

        <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
          <span style={infoLabelStyle}>ID de l'appareil</span>
          <span style={{ ...infoValueStyle, fontSize: 12 }}>
            {deviceId}
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
