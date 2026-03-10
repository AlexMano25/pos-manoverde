/**
 * WebhooksPage — Manage webhook endpoints and view delivery history
 * Also manages API keys for external integrations.
 */
import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Webhook,
  Plus,
  Trash2,
  Play,
  PauseCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Key,
  Send,
  AlertTriangle,
  RotateCcw,
  Shield,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import {
  getEndpoints,
  createEndpoint,
  deleteEndpoint,
  toggleEndpoint,
  getDeliveryLog,
  getDeliveryStats,
  clearDeliveryLog,
  testEndpoint,
  retryFailedDeliveries,
  WEBHOOK_EVENT_CATEGORIES,
  getEventLabel,
  type WebhookEndpoint,
  type WebhookDelivery,
  type WebhookEventType,
} from '../utils/webhookEngine'
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  getApiUsageStats,
  SCOPE_LABELS,
  SCOPE_DESCRIPTIONS,
  type ApiKey,
  type ApiKeyScope,
  type ApiKeyWithSecret,
} from '../utils/apiKeyManager'

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
  purple: '#7c3aed',
}

type Tab = 'webhooks' | 'api_keys' | 'deliveries'

export default function WebhooksPage() {
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const storeId = currentStore?.id || ''

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('webhooks')

  // Webhook state
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null)

  // Add form state
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<WebhookEventType[]>([])

  // API key state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showAddKeyForm, setShowAddKeyForm] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [keyScopes, setKeyScopes] = useState<ApiKeyScope[]>(['read'])
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null)
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set())

  // i18n
  const wh = useMemo(() => {
    const w = (t as unknown as Record<string, any>).webhooks || {}
    return {
      title: w.title || 'Webhooks & API',
      subtitle: w.subtitle || 'Manage external integrations, webhooks, and API keys',
      webhooksTab: w.webhooksTab || 'Webhooks',
      apiKeysTab: w.apiKeysTab || 'API Keys',
      deliveriesTab: w.deliveriesTab || 'Delivery Log',
      addEndpoint: w.addEndpoint || 'Add Endpoint',
      endpointName: w.endpointName || 'Endpoint Name',
      endpointUrl: w.endpointUrl || 'URL',
      selectEvents: w.selectEvents || 'Select Events',
      noEndpoints: w.noEndpoints || 'No webhook endpoints configured. Add one to start receiving real-time events.',
      secret: w.secret || 'Signing Secret',
      test: w.test || 'Test',
      testing: w.testing || 'Testing...',
      testSuccess: w.testSuccess || 'Webhook delivered successfully',
      testFailed: w.testFailed || 'Delivery failed',
      active: w.active || 'Active',
      paused: w.paused || 'Paused',
      deliveries: w.deliveries || 'Deliveries',
      noDeliveries: w.noDeliveries || 'No deliveries yet. Events will appear here when triggered.',
      clearLog: w.clearLog || 'Clear Log',
      retryFailed: w.retryFailed || 'Retry Failed',
      sent: w.sent || 'Sent',
      failed: w.failed || 'Failed',
      pending: w.pending || 'Pending',
      event: w.event || 'Event',
      status: w.status || 'Status',
      timestamp: w.timestamp || 'Timestamp',
      response: w.response || 'Response',
      // API keys
      addApiKey: w.addApiKey || 'Create API Key',
      keyName: w.keyName || 'Key Name',
      scopes: w.scopes || 'Permissions',
      noApiKeys: w.noApiKeys || 'No API keys created. Generate a key to enable external API access.',
      rateLimit: w.rateLimit || 'Rate Limit',
      requestsPerMin: w.requestsPerMin || 'req/min',
      totalRequests: w.totalRequests || 'Total Requests',
      lastUsed: w.lastUsed || 'Last Used',
      never: w.never || 'Never',
      copyKey: w.copyKey || 'Copy Key',
      keyCopied: w.keyCopied || 'Key copied!',
      keyCreated: w.keyCreated || 'Key created! Copy it now — it won\'t be shown again.',
      revoke: w.revoke || 'Revoke',
      revoked: w.revoked || 'Revoked',
    }
  }, [t])

  // Load data
  const loadData = useCallback(() => {
    if (!storeId) return
    setEndpoints(getEndpoints(storeId))
    setDeliveries(getDeliveryLog(storeId))
    setApiKeys(getApiKeys(storeId))
  }, [storeId])

  useEffect(() => { loadData() }, [loadData])

  const stats = useMemo(() => getDeliveryStats(storeId), [storeId, deliveries])
  const apiStats = useMemo(() => getApiUsageStats(storeId), [storeId, apiKeys])

  // ── Handlers ───────────────────────────────────────────────────

  const handleAddEndpoint = () => {
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) return
    createEndpoint(storeId, formName.trim(), formUrl.trim(), formEvents)
    setFormName('')
    setFormUrl('')
    setFormEvents([])
    setShowAddForm(false)
    loadData()
  }

  const handleDeleteEndpoint = (id: string) => {
    deleteEndpoint(id)
    loadData()
  }

  const handleToggleEndpoint = (id: string) => {
    toggleEndpoint(id)
    loadData()
  }

  const handleTestEndpoint = async (ep: WebhookEndpoint) => {
    setTestingId(ep.id)
    setTestResult(null)
    const result = await testEndpoint(ep)
    setTestResult({
      id: ep.id,
      success: result.success,
      msg: result.success
        ? `${wh.testSuccess} (${result.statusCode}, ${result.durationMs}ms)`
        : `${wh.testFailed}: ${result.error || 'HTTP ' + result.statusCode}`,
    })
    setTestingId(null)
  }

  const handleRetryFailed = async () => {
    const count = await retryFailedDeliveries(storeId)
    if (count > 0) {
      setTimeout(loadData, 2000)
    }
  }

  const handleClearLog = () => {
    clearDeliveryLog(storeId)
    loadData()
  }

  const toggleEvent = (ev: WebhookEventType) => {
    setFormEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    )
  }

  // API Key handlers
  const handleCreateApiKey = async () => {
    if (!keyName.trim()) return
    const result: ApiKeyWithSecret = await createApiKey(storeId, keyName.trim(), keyScopes)
    setNewKeySecret(result.full_key)
    setKeyName('')
    setKeyScopes(['read'])
    setShowAddKeyForm(false)
    loadData()
  }

  const handleRevokeKey = (id: string) => {
    revokeApiKey(id)
    loadData()
  }

  const handleDeleteKey = (id: string) => {
    deleteApiKey(id)
    loadData()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  // ── Styles ─────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    padding: rv(16, 24, 24),
    backgroundColor: C.bg,
    minHeight: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    border: `1px solid ${C.border}`,
    padding: rv(16, 20, 24),
    marginBottom: 16,
  }

  const btnPrimary: React.CSSProperties = {
    backgroundColor: C.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const btnOutline: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: C.textSecondary,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: active ? C.primary : 'transparent',
    color: active ? '#fff' : C.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  })

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    backgroundColor: color + '15',
    color,
  })

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: rv(20, 24, 24), fontWeight: 700, color: C.text, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Webhook size={24} color={C.purple} />
          {wh.title}
        </h1>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>{wh.subtitle}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={tabStyle(activeTab === 'webhooks')} onClick={() => setActiveTab('webhooks')}>
          <Send size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {wh.webhooksTab}
        </button>
        <button style={tabStyle(activeTab === 'api_keys')} onClick={() => setActiveTab('api_keys')}>
          <Key size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {wh.apiKeysTab}
        </button>
        <button style={tabStyle(activeTab === 'deliveries')} onClick={() => setActiveTab('deliveries')}>
          <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {wh.deliveriesTab}
          {stats.failed > 0 && (
            <span style={{ marginLeft: 6, backgroundColor: C.danger, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>
              {stats.failed}
            </span>
          )}
        </button>
      </div>

      {/* ── Webhooks Tab ─────────────────────────────────────────── */}
      {activeTab === 'webhooks' && (
        <>
          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: rv('repeat(2, 1fr)', 'repeat(4, 1fr)', 'repeat(4, 1fr)'),
            gap: 12,
            marginBottom: 16,
          }}>
            {[
              { label: 'Endpoints', value: endpoints.length, color: C.purple },
              { label: wh.active, value: endpoints.filter(e => e.active).length, color: C.success },
              { label: wh.sent, value: stats.sent, color: C.primary },
              { label: wh.failed, value: stats.failed, color: C.danger },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: s.color + '10',
                border: `1px solid ${s.color}30`,
              }}>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Add button */}
          <div style={{ marginBottom: 16 }}>
            <button style={btnPrimary} onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={16} />
              {wh.addEndpoint}
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div style={{ ...cardStyle, backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>{wh.endpointName}</label>
                  <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="My Integration" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>{wh.endpointUrl}</label>
                  <input style={inputStyle} value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://example.com/webhook" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>{wh.selectEvents}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(WEBHOOK_EVENT_CATEGORIES).map(([cat, events]) => (
                      <div key={cat} style={{ marginBottom: 8, width: '100%' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: 'uppercase', marginBottom: 4 }}>{cat}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {events.map(ev => (
                            <button
                              key={ev}
                              onClick={() => toggleEvent(ev)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: `1px solid ${formEvents.includes(ev) ? C.primary : C.border}`,
                                backgroundColor: formEvents.includes(ev) ? C.primary + '15' : '#fff',
                                color: formEvents.includes(ev) ? C.primary : C.textSecondary,
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              {getEventLabel(ev)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnPrimary} onClick={handleAddEndpoint}>
                    <Plus size={14} />
                    {t.common.save}
                  </button>
                  <button style={btnOutline} onClick={() => setShowAddForm(false)}>
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Endpoint list */}
          {endpoints.length === 0 && !showAddForm ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
              <Webhook size={40} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>{wh.noEndpoints}</p>
            </div>
          ) : (
            endpoints.map(ep => (
              <div key={ep.id} style={{ ...cardStyle, opacity: ep.active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{ep.name}</h4>
                      <span style={badgeStyle(ep.active ? C.success : C.warning)}>
                        {ep.active ? <CheckCircle size={10} /> : <PauseCircle size={10} />}
                        {ep.active ? wh.active : wh.paused}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: C.primary, margin: '0 0 8px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {ep.url}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {ep.events.map(ev => (
                        <span key={ev} style={{ ...badgeStyle(C.purple), fontSize: 10 }}>
                          {getEventLabel(ev)}
                        </span>
                      ))}
                    </div>
                    {/* Secret (hidden by default) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.textSecondary }}>
                      <Shield size={12} />
                      <span>{wh.secret}:</span>
                      <code style={{ fontFamily: 'monospace', fontSize: 10 }}>
                        {visibleSecrets.has(ep.id) ? ep.secret : ep.secret.slice(0, 10) + '...'}
                      </code>
                      <button
                        style={{ ...btnOutline, padding: '2px 6px', fontSize: 10 }}
                        onClick={() => setVisibleSecrets(prev => {
                          const next = new Set(prev)
                          next.has(ep.id) ? next.delete(ep.id) : next.add(ep.id)
                          return next
                        })}
                      >
                        {visibleSecrets.has(ep.id) ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                      <button
                        style={{ ...btnOutline, padding: '2px 6px', fontSize: 10 }}
                        onClick={() => copyToClipboard(ep.secret)}
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      style={{ ...btnOutline, color: C.primary }}
                      onClick={() => handleTestEndpoint(ep)}
                      disabled={testingId === ep.id}
                    >
                      {testingId === ep.id ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                      {testingId === ep.id ? wh.testing : wh.test}
                    </button>
                    <button
                      style={{ ...btnOutline, color: ep.active ? C.warning : C.success }}
                      onClick={() => handleToggleEndpoint(ep.id)}
                    >
                      {ep.active ? <PauseCircle size={12} /> : <CheckCircle size={12} />}
                    </button>
                    <button
                      style={{ ...btnOutline, color: C.danger }}
                      onClick={() => handleDeleteEndpoint(ep.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Test result */}
                {testResult && testResult.id === ep.id && (
                  <div style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: testResult.success ? C.success + '10' : C.danger + '10',
                    color: testResult.success ? C.success : C.danger,
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {testResult.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {testResult.msg}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* ── API Keys Tab ─────────────────────────────────────────── */}
      {activeTab === 'api_keys' && (
        <>
          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: rv('repeat(3, 1fr)', 'repeat(3, 1fr)', 'repeat(3, 1fr)'),
            gap: 12,
            marginBottom: 16,
          }}>
            {[
              { label: 'Total Keys', value: apiStats.totalKeys, color: C.purple },
              { label: wh.active, value: apiStats.activeKeys, color: C.success },
              { label: wh.totalRequests, value: apiStats.totalRequests, color: C.primary },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 12,
                borderRadius: 10,
                backgroundColor: s.color + '10',
                border: `1px solid ${s.color}30`,
              }}>
                <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Newly created key secret */}
          {newKeySecret && (
            <div style={{
              ...cardStyle,
              backgroundColor: '#fffbeb',
              borderColor: C.warning,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} color={C.warning} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{wh.keyCreated}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: '#fff',
                  border: `1px solid ${C.border}`,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  wordBreak: 'break-all',
                }}>
                  {newKeySecret}
                </code>
                <button
                  style={btnPrimary}
                  onClick={() => {
                    copyToClipboard(newKeySecret)
                    setNewKeySecret(null)
                  }}
                >
                  <Copy size={14} />
                  {wh.copyKey}
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <button style={btnPrimary} onClick={() => setShowAddKeyForm(!showAddKeyForm)}>
              <Plus size={16} />
              {wh.addApiKey}
            </button>
          </div>

          {/* Add key form */}
          {showAddKeyForm && (
            <div style={{ ...cardStyle, backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>{wh.keyName}</label>
                  <input style={inputStyle} value={keyName} onChange={e => setKeyName(e.target.value)} placeholder="My Integration Key" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, display: 'block', marginBottom: 4 }}>{wh.scopes}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(Object.keys(SCOPE_LABELS) as ApiKeyScope[]).map(scope => (
                      <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={keyScopes[0] === scope}
                          onChange={() => setKeyScopes([scope])}
                        />
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{SCOPE_LABELS[scope]}</span>
                          <span style={{ fontSize: 11, color: C.textSecondary, display: 'block' }}>{SCOPE_DESCRIPTIONS[scope]}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnPrimary} onClick={handleCreateApiKey}>
                    <Key size={14} />
                    {t.common.save}
                  </button>
                  <button style={btnOutline} onClick={() => setShowAddKeyForm(false)}>
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Key list */}
          {apiKeys.length === 0 && !showAddKeyForm ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
              <Key size={40} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>{wh.noApiKeys}</p>
            </div>
          ) : (
            apiKeys.map(k => (
              <div key={k.id} style={{ ...cardStyle, opacity: k.active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{k.name}</h4>
                      <span style={badgeStyle(k.active ? C.success : C.danger)}>
                        {k.active ? wh.active : wh.revoked}
                      </span>
                      {k.scopes.map(s => (
                        <span key={s} style={badgeStyle(C.purple)}>{SCOPE_LABELS[s]}</span>
                      ))}
                    </div>
                    <code style={{ fontSize: 12, fontFamily: 'monospace', color: C.textSecondary }}>
                      {k.key_prefix}{'•'.repeat(20)}
                    </code>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: C.textSecondary }}>
                      <span>{wh.totalRequests}: {k.request_count}</span>
                      <span>{wh.rateLimit}: {k.rate_limit} {wh.requestsPerMin}</span>
                      <span>{wh.lastUsed}: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : wh.never}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {k.active && (
                      <button style={{ ...btnOutline, color: C.warning }} onClick={() => handleRevokeKey(k.id)}>
                        <XCircle size={12} />
                        {wh.revoke}
                      </button>
                    )}
                    <button style={{ ...btnOutline, color: C.danger }} onClick={() => handleDeleteKey(k.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ── Deliveries Tab ───────────────────────────────────────── */}
      {activeTab === 'deliveries' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button style={btnOutline} onClick={handleRetryFailed} disabled={stats.failed === 0}>
              <RotateCcw size={12} />
              {wh.retryFailed} ({stats.failed})
            </button>
            <button style={btnOutline} onClick={handleClearLog} disabled={deliveries.length === 0}>
              <Trash2 size={12} />
              {wh.clearLog}
            </button>
            <button style={btnOutline} onClick={loadData}>
              <RefreshCw size={12} />
            </button>
          </div>

          {deliveries.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
              <Clock size={40} color={C.border} style={{ marginBottom: 12 }} />
              <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>{wh.noDeliveries}</p>
            </div>
          ) : (
            <div style={cardStyle}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      <th style={{ textAlign: 'left', padding: '8px 6px', color: C.textSecondary, fontWeight: 600 }}>{wh.event}</th>
                      <th style={{ textAlign: 'left', padding: '8px 6px', color: C.textSecondary, fontWeight: 600 }}>Endpoint</th>
                      <th style={{ textAlign: 'center', padding: '8px 6px', color: C.textSecondary, fontWeight: 600 }}>{wh.status}</th>
                      {!isMobile && (
                        <th style={{ textAlign: 'center', padding: '8px 6px', color: C.textSecondary, fontWeight: 600 }}>Code</th>
                      )}
                      <th style={{ textAlign: 'right', padding: '8px 6px', color: C.textSecondary, fontWeight: 600 }}>{wh.timestamp}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(d => (
                      <tr key={d.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 6px' }}>
                          <span style={badgeStyle(C.purple)}>{getEventLabel(d.event)}</span>
                        </td>
                        <td style={{ padding: '8px 6px', fontWeight: 500 }}>{d.endpoint_name}</td>
                        <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                          <span style={badgeStyle(
                            d.status === 'sent' ? C.success : d.status === 'failed' ? C.danger : C.warning
                          )}>
                            {d.status === 'sent' ? <CheckCircle size={10} /> : d.status === 'failed' ? <XCircle size={10} /> : <Clock size={10} />}
                            {d.status === 'sent' ? wh.sent : d.status === 'failed' ? wh.failed : wh.pending}
                          </span>
                        </td>
                        {!isMobile && (
                          <td style={{ padding: '8px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: 11 }}>
                            {d.status_code || '—'}
                          </td>
                        )}
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: 11, color: C.textSecondary }}>
                          {new Date(d.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
