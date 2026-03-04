import { useEffect, useRef, useState } from 'react'
import { useLanguageStore } from '../../stores/languageStore'
import type { PayPalResult } from '../../types'

// ---------------------------------------------------------------------------
// PayPal JS SDK wrapper — loads the SDK dynamically and renders buttons
// Supports two modes: subscription (recurring) and capture (one-time)
// ---------------------------------------------------------------------------

interface PayPalButtonProps {
  mode: 'subscription' | 'capture'
  planId?: string          // PayPal subscription plan ID (for mode='subscription')
  amount?: number          // USD amount (for mode='capture')
  onSuccess: (result: PayPalResult) => void
  onError: (error: Error) => void
  disabled?: boolean
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => {
        render: (el: HTMLElement) => Promise<void>
        close: () => void
      }
    }
  }
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || ''

export default function PayPalButton({ mode, planId, amount, onSuccess, onError, disabled }: PayPalButtonProps) {
  const { t } = useLanguageStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const buttonsRef = useRef<{ close: () => void } | null>(null)

  // ── Load PayPal SDK script ──────────────────────────────────────────────
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setLoading(false)
      return
    }

    // Check if already loaded
    if (window.paypal) {
      setSdkReady(true)
      setLoading(false)
      return
    }

    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setSdkReady(true)
        setLoading(false)
      })
      return
    }

    const script = document.createElement('script')
    const intent = mode === 'subscription' ? 'subscription' : 'capture'
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=${intent}&currency=USD`
    script.async = true
    script.onload = () => {
      setSdkReady(true)
      setLoading(false)
    }
    script.onerror = () => {
      setLoading(false)
      onError(new Error('Failed to load PayPal SDK'))
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup buttons on unmount
      if (buttonsRef.current) {
        try { buttonsRef.current.close() } catch { /* ignore */ }
      }
    }
  }, [mode])

  // ── Render PayPal buttons when SDK is ready ─────────────────────────────
  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current || disabled) return

    // Clear previous buttons
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }

    const buttonConfig: Record<string, unknown> = {
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: mode === 'subscription' ? 'subscribe' : 'pay',
        height: 44,
      },
      onError: (err: Error) => {
        onError(err)
      },
    }

    if (mode === 'subscription' && planId) {
      buttonConfig.createSubscription = (_data: unknown, actions: { subscription: { create: (opts: Record<string, unknown>) => Promise<string> } }) => {
        return actions.subscription.create({
          plan_id: planId,
        })
      }
      buttonConfig.onApprove = (data: { subscriptionID: string; orderID?: string }) => {
        onSuccess({
          mode: 'subscription',
          subscriptionId: data.subscriptionID,
          orderId: data.orderID,
          status: 'ACTIVE',
        })
      }
    } else if (mode === 'capture' && amount) {
      buttonConfig.createOrder = (_data: unknown, actions: { order: { create: (opts: Record<string, unknown>) => Promise<string> } }) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2),
              currency_code: 'USD',
            },
          }],
        })
      }
      buttonConfig.onApprove = (_data: { orderID: string }, actions: { order: { capture: () => Promise<{ id: string; payer: { payer_id: string }; status: string }> } }) => {
        return actions.order.capture().then((details) => {
          onSuccess({
            mode: 'capture',
            orderId: details.id,
            payerId: details.payer?.payer_id,
            amount,
            currency: 'USD',
            status: details.status,
          })
        })
      }
    }

    try {
      const buttons = window.paypal!.Buttons(buttonConfig)
      buttons.render(containerRef.current!)
      buttonsRef.current = buttons
    } catch (err) {
      console.error('[PayPalButton] Failed to render:', err)
    }
  }, [sdkReady, mode, planId, amount, disabled])

  // ── Not configured state ────────────────────────────────────────────────
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#fffbeb',
        borderRadius: 10,
        border: '1px solid #fde68a',
        fontSize: 13,
        color: '#92400e',
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        {t.billing.paypalNotConfigured}
      </div>
    )
  }

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 14,
      }}>
        {t.common.loading}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: 50,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    />
  )
}
