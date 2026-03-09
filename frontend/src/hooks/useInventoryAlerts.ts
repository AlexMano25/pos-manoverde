// ---------------------------------------------------------------------------
// useInventoryAlerts — Background hook that auto-generates notifications
// for low stock and expiring products
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { useProductStore } from '../stores/productStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useAppStore } from '../stores/appStore'

/**
 * Call once in App.tsx.
 * On each product load, checks for:
 * 1. Products with stock <= min_stock → low_stock notification
 * 2. Products with expiry_date within 30 days → low_stock notification (expiry variant)
 *
 * Deduplicates by checking existing notifications for the same product today.
 */
export function useInventoryAlerts() {
  const { products } = useProductStore()
  const { notifications, addNotification, loadNotifications } = useNotificationStore()
  const { currentStore } = useAppStore()
  const lastCheckRef = useRef<string>('')

  useEffect(() => {
    const storeId = currentStore?.id
    if (!storeId || products.length === 0) return

    // Deduplicate: only check once per store per day
    const today = new Date().toISOString().slice(0, 10)
    const checkKey = `${storeId}_${today}_${products.length}`
    if (lastCheckRef.current === checkKey) return
    lastCheckRef.current = checkKey

    // Load notifications first to check for duplicates
    const runCheck = async () => {
      await loadNotifications(storeId)
      const todayNotifs = notifications.filter(
        n => n.created_at.slice(0, 10) === today && !n.is_dismissed
      )

      const now = new Date()
      const day30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // --- Low stock alerts ---
      const lowStockProducts = products.filter(
        p => p.is_active && p.stock > 0 && p.stock <= (p.min_stock ?? 5)
      )
      const outOfStockProducts = products.filter(
        p => p.is_active && p.stock === 0
      )

      // Check if we already have a low_stock alert today
      const hasLowStockAlert = todayNotifs.some(
        n => n.type === 'low_stock' && n.title.includes('stock')
      )

      if (!hasLowStockAlert && (lowStockProducts.length > 0 || outOfStockProducts.length > 0)) {
        const parts: string[] = []
        if (outOfStockProducts.length > 0) {
          parts.push(`${outOfStockProducts.length} en rupture`)
        }
        if (lowStockProducts.length > 0) {
          parts.push(`${lowStockProducts.length} en stock faible`)
        }

        try {
          await addNotification(storeId, {
            type: 'low_stock',
            priority: outOfStockProducts.length > 0 ? 'high' : 'medium',
            title: `Alerte stock : ${parts.join(', ')}`,
            message: [
              ...outOfStockProducts.slice(0, 3).map(p => `⛔ ${p.name} — rupture`),
              ...lowStockProducts.slice(0, 3).map(p => `⚠️ ${p.name} — ${p.stock} restant(s)`),
              (lowStockProducts.length + outOfStockProducts.length > 6) ? '...' : '',
            ].filter(Boolean).join('\n'),
          })
        } catch {
          // silently fail — non-critical
        }
      }

      // --- Expiry alerts ---
      const expiringProducts = products.filter(p => {
        if (!p.expiry_date || !p.is_active) return false
        const exp = new Date(p.expiry_date)
        return exp <= day30 && exp >= now
      })
      const expiredProducts = products.filter(p => {
        if (!p.expiry_date || !p.is_active) return false
        return new Date(p.expiry_date) < now
      })

      const hasExpiryAlert = todayNotifs.some(
        n => n.type === 'low_stock' && (n.title.includes('expir') || n.title.includes('périm'))
      )

      if (!hasExpiryAlert && (expiringProducts.length > 0 || expiredProducts.length > 0)) {
        const parts: string[] = []
        if (expiredProducts.length > 0) {
          parts.push(`${expiredProducts.length} expiré(s)`)
        }
        if (expiringProducts.length > 0) {
          parts.push(`${expiringProducts.length} expirent bientôt`)
        }

        try {
          await addNotification(storeId, {
            type: 'low_stock',
            priority: expiredProducts.length > 0 ? 'high' : 'medium',
            title: `Alerte péremption : ${parts.join(', ')}`,
            message: [
              ...expiredProducts.slice(0, 3).map(p => `🔴 ${p.name} — expiré`),
              ...expiringProducts.slice(0, 3).map(p => {
                const days = Math.ceil((new Date(p.expiry_date!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
                return `🟡 ${p.name} — expire dans ${days}j`
              }),
              (expiringProducts.length + expiredProducts.length > 6) ? '...' : '',
            ].filter(Boolean).join('\n'),
          })
        } catch {
          // silently fail
        }
      }
    }

    // Run after a short delay to not block initial render
    const timer = setTimeout(runCheck, 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length, currentStore?.id])
}
