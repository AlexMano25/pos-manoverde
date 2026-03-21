import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChefHat, Flame, Clock, Check, AlertTriangle,
  Loader2, Maximize, Minimize, Volume2, VolumeX, Filter,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useKdsStore } from '../stores/kdsStore'
import { useLanguageStore } from '../stores/languageStore'
import { useResponsive } from '../hooks/useLayoutMode'
import type { KdsOrder, KdsOrderStatus, KdsStation } from '../types'

// ── Colors (DARK kitchen theme) ─────────────────────────────────────────────

const C = {
  primary: '#ea580c',
  primaryLight: '#fb923c',
  primaryDark: '#c2410c',
  bg: '#1e293b',
  bgDarker: '#0f172a',
  card: '#334155',
  cardHover: '#3e4f66',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#475569',
  success: '#16a34a',
  successLight: '#22c55e',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  danger: '#dc2626',
  dangerLight: '#ef4444',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  purple: '#8b5cf6',
} as const

// ── Station config ──────────────────────────────────────────────────────────

const STATIONS: { key: KdsStation; color: string; emoji: string }[] = [
  { key: 'all', color: C.primary, emoji: '🍽️' },
  { key: 'grill', color: '#ef4444', emoji: '🔥' },
  { key: 'fridge', color: '#06b6d4', emoji: '❄️' },
  { key: 'drinks', color: '#8b5cf6', emoji: '🥤' },
  { key: 'pastry', color: '#ec4899', emoji: '🧁' },
  { key: 'expo', color: '#f59e0b', emoji: '📤' },
]

// ── Status config ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<KdsOrderStatus, { bg: string; text: string; label: string }> = {
  new: { bg: C.blue, text: '#ffffff', label: 'New' },
  in_progress: { bg: C.primary, text: '#ffffff', label: 'In Progress' },
  ready: { bg: C.success, text: '#ffffff', label: 'Ready' },
  served: { bg: C.textSecondary, text: '#ffffff', label: 'Served' },
}

// ── Timer color thresholds ──────────────────────────────────────────────────

function getTimerColor(minutes: number): string {
  if (minutes < 5) return C.successLight
  if (minutes < 10) return C.warningLight
  return C.dangerLight
}

function getTimerBg(minutes: number): string {
  if (minutes < 5) return 'rgba(22,163,74,0.2)'
  if (minutes < 10) return 'rgba(245,158,11,0.2)'
  return 'rgba(220,38,38,0.25)'
}

// ── Component ───────────────────────────────────────────────────────────────

export default function KitchenDisplayPage() {
  const { currentStore } = useAppStore()
  const {
    orders, loading, stationFilter,
    loadOrders, updateItemStatus, bumpOrder, startOrder,
    markServed, togglePriority, setStationFilter, getHistory,
  } = useKdsStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  // i18n fallback
  const label = (t as Record<string, unknown>).kds || {} as Record<string, string>
  const kl = label as Record<string, string>
  const L = {
    title: kl.title || 'Kitchen Display',
    newOrders: kl.newOrders || 'New',
    inProgress: kl.inProgress || 'In Progress',
    ready: kl.ready || 'Ready',
    avgTime: kl.avgTime || 'Avg Time',
    bump: kl.bump || 'BUMP',
    start: kl.start || 'START',
    noOrders: kl.noOrders || 'No orders to display',
    noOrdersSub: kl.noOrdersSub || 'New kitchen orders will appear here automatically',
    priority: kl.priority || 'Priority',
    table: kl.table || 'Table',
    items: kl.items || 'items',
    notes: kl.notes || 'Notes',
    all: kl.all || 'All',
    grill: kl.grill || 'Grill',
    fridge: kl.fridge || 'Fridge',
    drinks: kl.drinks || 'Drinks',
    pastry: kl.pastry || 'Pastry',
    expo: kl.expo || 'Expo',
    loading: kl.loading || 'Loading kitchen orders...',
    fullscreen: kl.fullscreen || 'Toggle fullscreen',
    sound: kl.sound || 'Toggle sound',
    min: kl.min || 'min',
    served: kl.served || 'SERVI',
    history: kl.history || 'Historique',
    servedCount: kl.servedCount || 'servis',
  }

  const STATION_LABELS: Record<KdsStation, string> = {
    all: L.all, grill: L.grill, fridge: L.fridge,
    drinks: L.drinks, pastry: L.pastry, expo: L.expo,
  }

  const storeId = currentStore?.id || 'default-store'

  // ── State ──────────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [showHistory, setShowHistory] = useState(false)

  // ── Load orders on mount + auto-refresh every 5s ───────────────────────────
  useEffect(() => {
    loadOrders(storeId)
  }, [storeId, loadOrders])

  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(storeId)
    }, 5000)
    return () => clearInterval(interval)
  }, [storeId, loadOrders])

  // ── Timer tick every second ────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Fullscreen toggle ──────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Filter + sort orders ──────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'served')
    const byStation = stationFilter === 'all'
      ? active
      : active.filter((o) => o.station === stationFilter)

    return byStation.sort((a, b) => {
      // Priority orders first
      if (a.priority && !b.priority) return -1
      if (!a.priority && b.priority) return 1
      // Then oldest first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  }, [orders, stationFilter])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'served')
    const newCount = active.filter((o) => o.status === 'new').length
    const progressCount = active.filter((o) => o.status === 'in_progress').length
    const readyCount = active.filter((o) => o.status === 'ready').length

    const inProgressOrders = active.filter((o) => o.status === 'in_progress')
    let avgMinutes = 0
    if (inProgressOrders.length > 0) {
      const totalElapsed = inProgressOrders.reduce((sum, o) => {
        const elapsed = Math.floor((now - new Date(o.created_at).getTime()) / 1000)
        return sum + elapsed
      }, 0)
      avgMinutes = Math.floor(totalElapsed / inProgressOrders.length / 60)
    }

    const servedCount = getHistory().length

    return { newCount, progressCount, readyCount, avgMinutes, servedCount }
  }, [orders, now, getHistory])

  // ── Elapsed time helper ───────────────────────────────────────────────────
  const getElapsed = useCallback((createdAt: string) => {
    const elapsed = Math.floor((now - new Date(createdAt).getTime()) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return { minutes, seconds, elapsed }
  }, [now])

  // ── Item done count ───────────────────────────────────────────────────────
  const getItemProgress = useCallback((order: KdsOrder) => {
    const total = order.items.length
    const done = order.items.filter((i) => i.done).length
    return { total, done, allDone: done === total && total > 0 }
  }, [])

  // ── Sound effect (simple beep) ────────────────────────────────────────────
  const playBumpSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.value = 0.3
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.stop(ctx.currentTime + 0.15)
    } catch {
      // Audio not supported
    }
  }, [soundEnabled])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStart = useCallback(async (id: string) => {
    await startOrder(id)
    playBumpSound()
  }, [startOrder, playBumpSound])

  const handleBump = useCallback(async (id: string) => {
    await bumpOrder(id)
    playBumpSound()
  }, [bumpOrder, playBumpSound])

  const handleToggleItem = useCallback(async (orderId: string, itemIndex: number, currentDone: boolean) => {
    await updateItemStatus(orderId, itemIndex, !currentDone)
  }, [updateItemStatus])

  const handleServed = useCallback(async (id: string) => {
    await markServed(id)
    playBumpSound()
  }, [markServed, playBumpSound])

  const handleTogglePriority = useCallback(async (id: string) => {
    await togglePriority(id)
  }, [togglePriority])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && orders.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', backgroundColor: C.bg,
        gap: 16,
      }}>
        <style>{keyframesCSS}</style>
        <Loader2 size={48} color={C.primary} style={{ animation: 'kds-spin 1s linear infinite' }} />
        <span style={{ color: C.textSecondary, fontSize: 18, fontWeight: 500 }}>{L.loading}</span>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: C.bg,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{keyframesCSS}</style>

      {/* ── HEADER BAR ──────────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: C.bgDarker,
        borderBottom: `2px solid ${C.primary}`,
        padding: rv('10px 12px', '12px 20px', '14px 24px'),
        display: 'flex',
        flexDirection: rv('column', 'row', 'row') as React.CSSProperties['flexDirection'],
        alignItems: rv('stretch', 'center', 'center'),
        gap: rv(10, 14, 16),
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Title row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: rv('space-between', 'flex-start', 'flex-start'),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: rv(36, 40, 44), height: rv(36, 40, 44),
              borderRadius: 10, backgroundColor: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChefHat size={rv(20, 24, 26)} color="#fff" />
            </div>
            <h1 style={{
              margin: 0, fontSize: rv(18, 22, 26), fontWeight: 800,
              color: C.text, letterSpacing: -0.5,
            }}>
              {L.title}
            </h1>
          </div>

          {/* Mobile-only controls */}
          {isMobile && (
            <div style={{ display: 'flex', gap: 6 }}>
              <HeaderIconButton
                onClick={() => setSoundEnabled((v) => !v)}
                title={L.sound}
                active={soundEnabled}
              >
                {soundEnabled ? <Volume2 size={18} color={C.text} /> : <VolumeX size={18} color={C.textSecondary} />}
              </HeaderIconButton>
              <HeaderIconButton onClick={toggleFullscreen} title={L.fullscreen}>
                {isFullscreen
                  ? <Minimize size={18} color={C.text} />
                  : <Maximize size={18} color={C.text} />
                }
              </HeaderIconButton>
            </div>
          )}
        </div>

        {/* Station filters */}
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1,
          alignItems: 'center',
        }}>
          <Filter size={16} color={C.textSecondary} style={{ marginRight: 4 }} />
          {STATIONS.map(({ key, color, emoji }) => {
            const isActive = stationFilter === key
            return (
              <button
                type="button"
                key={key}
                onClick={() => setStationFilter(key)}
                style={{
                  padding: rv('5px 10px', '6px 14px', '7px 16px'),
                  borderRadius: 20,
                  border: `2px solid ${isActive ? color : 'transparent'}`,
                  backgroundColor: isActive ? `${color}22` : C.card,
                  color: isActive ? color : C.textSecondary,
                  fontSize: rv(12, 13, 14),
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{emoji}</span>
                <span>{STATION_LABELS[key]}</span>
              </button>
            )
          })}
        </div>

        {/* Stats + desktop controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: rv(6, 8, 10),
          flexWrap: 'wrap',
        }}>
          {/* Stats badges */}
          <StatBadge color={C.blue} count={stats.newCount} label={L.newOrders} />
          <StatBadge color={C.primary} count={stats.progressCount} label={L.inProgress} />
          <StatBadge color={C.success} count={stats.readyCount} label={L.ready} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 8,
            backgroundColor: `${C.purple}22`, color: C.purple,
            fontSize: 12, fontWeight: 600,
          }}>
            <Clock size={13} />
            <span>{stats.avgMinutes}{L.min}</span>
          </div>

          {/* Desktop controls */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
              <HeaderIconButton
                onClick={() => setSoundEnabled((v) => !v)}
                title={L.sound}
                active={soundEnabled}
              >
                {soundEnabled ? <Volume2 size={18} color={C.text} /> : <VolumeX size={18} color={C.textSecondary} />}
              </HeaderIconButton>
              <HeaderIconButton onClick={toggleFullscreen} title={L.fullscreen}>
                {isFullscreen
                  ? <Minimize size={18} color={C.text} />
                  : <Maximize size={18} color={C.text} />
                }
              </HeaderIconButton>
            </div>
          )}
        </div>
      </header>

      {/* ── ORDER GRID ──────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        padding: rv(10, 16, 20),
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {filteredOrders.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 400, gap: 16, opacity: 0.6,
          }}>
            <ChefHat size={64} color={C.textSecondary} />
            <p style={{ color: C.text, fontSize: 22, fontWeight: 700, margin: 0 }}>
              {L.noOrders}
            </p>
            <p style={{ color: C.textSecondary, fontSize: 15, margin: 0 }}>
              {L.noOrdersSub}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: rv('1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)'),
            gap: rv(10, 14, 16),
            alignItems: 'start',
          }}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                getElapsed={getElapsed}
                getItemProgress={getItemProgress}
                onStart={handleStart}
                onBump={handleBump}
                onServed={handleServed}
                onToggleItem={handleToggleItem}
                onTogglePriority={handleTogglePriority}
                labels={L}
                rv={rv}
              />
            ))}
          </div>
        )}

        {/* ── HISTORY TOGGLE ─────────────────────────────────────────── */}
        {stats.servedCount > 0 && (
          <div style={{ marginTop: 16, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${C.border}`,
                backgroundColor: showHistory ? `${C.textSecondary}22` : C.bgDarker,
                color: C.textSecondary, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <Check size={14} />
              {L.history} ({stats.servedCount} {L.servedCount})
            </button>

            {showHistory && (
              <div style={{
                marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6,
                maxHeight: 200, overflowY: 'auto',
              }}>
                {getHistory().map((order) => (
                  <div key={order.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 14px', borderRadius: 8,
                    backgroundColor: C.bgDarker, border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        #{order.order_number}
                      </span>
                      {order.table_number && (
                        <span style={{
                          fontSize: 11, color: C.blueLight, fontWeight: 500,
                        }}>
                          {order.table_number}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.textSecondary }}>
                        {order.completed_at
                          ? new Date(order.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4,
                        backgroundColor: `${C.textSecondary}22`,
                        color: C.textSecondary, fontSize: 10, fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {L.served}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Subcomponents ───────────────────────────────────────────────────────────

interface HeaderIconButtonProps {
  onClick: () => void
  title: string
  active?: boolean
  children: React.ReactNode
}

function HeaderIconButton({ onClick, title, active, children }: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 8,
        border: `1px solid ${active ? C.primary : C.border}`,
        backgroundColor: active ? `${C.primary}22` : C.card,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

// ── Stat Badge ──────────────────────────────────────────────────────────────

interface StatBadgeProps {
  color: string
  count: number
  label: string
}

function StatBadge({ color, count, label }: StatBadgeProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 8,
      backgroundColor: `${color}22`,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 6,
        backgroundColor: color, color: '#fff',
        fontSize: 12, fontWeight: 800,
      }}>
        {count}
      </span>
      <span style={{ color, fontSize: 12, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

// ── Order Card ──────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: KdsOrder
  getElapsed: (createdAt: string) => { minutes: number; seconds: number; elapsed: number }
  getItemProgress: (order: KdsOrder) => { total: number; done: number; allDone: boolean }
  onStart: (id: string) => void
  onBump: (id: string) => void
  onServed: (id: string) => void
  onToggleItem: (orderId: string, itemIndex: number, currentDone: boolean) => void
  onTogglePriority: (id: string) => void
  labels: Record<string, string>
  rv: <T>(mobile: T, tablet: T, desktop: T) => T
}

function OrderCard({
  order, getElapsed, getItemProgress,
  onStart, onBump, onServed, onToggleItem, onTogglePriority,
  labels, rv,
}: OrderCardProps) {
  const { minutes, seconds } = getElapsed(order.created_at)
  const { total, done, allDone } = getItemProgress(order)
  const timerColor = getTimerColor(minutes)
  const timerBg = getTimerBg(minutes)
  const isOverdue = minutes >= 10
  const statusInfo = STATUS_COLORS[order.status]
  const stationInfo = STATIONS.find((s) => s.key === order.station)

  const cardBorderColor = order.priority
    ? C.warning
    : order.status === 'ready'
      ? C.success
      : C.border

  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: 14,
      border: `2px solid ${cardBorderColor}`,
      overflow: 'hidden',
      boxShadow: order.priority
        ? `0 0 20px ${C.warning}33, 0 4px 12px rgba(0,0,0,0.3)`
        : '0 4px 12px rgba(0,0,0,0.25)',
      transition: 'all 0.3s',
      animation: order.priority ? 'kds-pulse 2s ease-in-out infinite' : undefined,
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: rv('10px 12px', '12px 14px', '14px 16px'),
        backgroundColor: C.bgDarker,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Order number + table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: rv(22, 26, 28), fontWeight: 900, color: C.text,
              letterSpacing: -0.5,
            }}>
              #{order.order_number}
            </span>
          </div>
          {order.table_number && (
            <div style={{
              marginTop: 4,
              padding: '3px 8px', borderRadius: 6,
              backgroundColor: `${C.blue}22`, color: C.blueLight,
              fontSize: 13, fontWeight: 600, display: 'inline-block',
            }}>
              {labels.table} {order.table_number}
            </div>
          )}
        </div>

        {/* Priority + station + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => onTogglePriority(order.id)}
            title={labels.priority}
            style={{
              width: 30, height: 30, borderRadius: 6,
              border: 'none', cursor: 'pointer',
              backgroundColor: order.priority ? `${C.warning}22` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <AlertTriangle
              size={16}
              color={order.priority ? C.warning : C.textSecondary}
              fill={order.priority ? C.warning : 'none'}
            />
          </button>
          {stationInfo && stationInfo.key !== 'all' && (
            <span style={{
              padding: '3px 8px', borderRadius: 6,
              backgroundColor: `${stationInfo.color}22`,
              color: stationInfo.color,
              fontSize: 11, fontWeight: 600,
            }}>
              {stationInfo.emoji}
            </span>
          )}
          <span style={{
            padding: '4px 10px', borderRadius: 6,
            backgroundColor: statusInfo.bg,
            color: statusInfo.text,
            fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        backgroundColor: timerBg,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Clock size={16} color={timerColor} />
          <span style={{
            fontSize: rv(18, 20, 22), fontWeight: 800, color: timerColor,
            fontFamily: 'monospace',
            animation: isOverdue ? 'kds-pulse 1s ease-in-out infinite' : undefined,
          }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        {order.priority && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            color: C.warning, fontSize: 13, fontWeight: 700,
          }}>
            <Flame size={16} color={C.warning} />
            <span>{labels.priority}</span>
          </div>
        )}
        <span style={{
          color: C.textSecondary, fontSize: 12, fontWeight: 500,
        }}>
          {done}/{total} {labels.items}
        </span>
      </div>

      {/* Items list */}
      <div style={{
        padding: rv('8px 12px', '10px 14px', '12px 16px'),
        display: 'flex', flexDirection: 'column', gap: 4,
        maxHeight: rv(220, 260, 300),
        overflowY: 'auto',
      }}>
        {order.items.map((item, idx) => (
          <button
            type="button"
            key={`${order.id}-item-${idx}`}
            onClick={() => onToggleItem(order.id, idx, item.done)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              backgroundColor: item.done ? `${C.success}15` : 'transparent',
              border: `1px solid ${item.done ? `${C.success}33` : 'transparent'}`,
              cursor: 'pointer', transition: 'all 0.15s',
              textAlign: 'left', width: '100%',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: rv(24, 26, 28), height: rv(24, 26, 28),
              borderRadius: 6,
              border: `2px solid ${item.done ? C.success : C.border}`,
              backgroundColor: item.done ? C.success : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
            }}>
              {item.done && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>

            {/* Item details */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{
                  fontSize: rv(14, 15, 16), fontWeight: 700,
                  color: item.done ? C.textSecondary : C.text,
                  textDecoration: item.done ? 'line-through' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {item.product_name}
                </span>
                <span style={{
                  backgroundColor: item.done ? C.textSecondary : C.primary,
                  color: '#fff', fontSize: 11, fontWeight: 800,
                  padding: '1px 6px', borderRadius: 4,
                  minWidth: 20, textAlign: 'center',
                }}>
                  x{item.quantity}
                </span>
              </div>
              {item.notes && (
                <p style={{
                  margin: '2px 0 0 0', fontSize: 12, fontStyle: 'italic',
                  color: C.warningLight, lineHeight: 1.3,
                }}>
                  {labels.notes}: {item.notes}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{
        margin: '0 14px 10px',
        height: 4, borderRadius: 2,
        backgroundColor: `${C.border}`,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: total > 0 ? `${(done / total) * 100}%` : '0%',
          backgroundColor: allDone ? C.success : C.primary,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Action buttons */}
      <div style={{
        padding: rv('8px 12px 12px', '10px 14px 14px', '10px 16px 16px'),
        display: 'flex', gap: 8,
      }}>
        {order.status === 'new' && (
          <ActionButton
            onClick={() => onStart(order.id)}
            bgColor={C.blue}
            hoverColor={C.blueLight}
            label={labels.start}
            icon={<Flame size={rv(16, 18, 20)} color="#fff" />}
            rv={rv}
          />
        )}
        {order.status === 'in_progress' && (
          <ActionButton
            onClick={() => onBump(order.id)}
            bgColor={C.success}
            hoverColor={C.successLight}
            label={labels.bump}
            icon={<Check size={rv(16, 18, 20)} color="#fff" strokeWidth={3} />}
            rv={rv}
            pulse={allDone}
          />
        )}
        {order.status === 'ready' && (
          <ActionButton
            onClick={() => onServed(order.id)}
            bgColor={C.success}
            hoverColor={C.successLight}
            label={labels.served}
            icon={<Check size={rv(16, 18, 20)} color="#fff" strokeWidth={3} />}
            rv={rv}
            pulse
          />
        )}
      </div>
    </div>
  )
}

// ── Action Button ───────────────────────────────────────────────────────────

interface ActionButtonProps {
  onClick: () => void
  bgColor: string
  hoverColor: string
  label: string
  icon: React.ReactNode
  rv: <T>(mobile: T, tablet: T, desktop: T) => T
  pulse?: boolean
}

function ActionButton({ onClick, bgColor, hoverColor, label, icon, rv, pulse }: ActionButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8,
        padding: rv('12px 0', '14px 0', '16px 0'),
        borderRadius: 10,
        border: 'none',
        backgroundColor: hovered ? hoverColor : bgColor,
        color: '#fff',
        fontSize: rv(15, 17, 19),
        fontWeight: 900,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered ? `0 4px 20px ${bgColor}66` : `0 2px 8px ${bgColor}44`,
        animation: pulse ? 'kds-pulse 1.5s ease-in-out infinite' : undefined,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ── CSS Keyframes ───────────────────────────────────────────────────────────

const keyframesCSS = `
  @keyframes kds-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes kds-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.7; }
  }
`
