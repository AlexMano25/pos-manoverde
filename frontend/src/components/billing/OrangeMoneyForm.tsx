import { useState } from 'react'
import { Smartphone, Loader2, ExternalLink, CreditCard as CardIcon } from 'lucide-react'
import { useLanguageStore } from '../../stores/languageStore'
import { supabase } from '../../services/supabase'
import type { OrangeMoneyStatus } from '../../types'

// ---------------------------------------------------------------------------
// Orange Money payment form
// Initiates payment via Supabase Edge Function → Orange Money Web Pay API
// Shows USSD confirmation waiting state + polling for result
// ---------------------------------------------------------------------------

interface OrangeMoneyFormProps {
  amount: number            // amount in XAF
  amountUSD: number         // amount in USD (for credit_balances)
  description: string       // payment description
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
  disabled?: boolean
}

const MAX_IT_LINK = 'https://www.orange.cm/fr/orange-money-max-it.html'

export default function OrangeMoneyForm({ amount, amountUSD, description, onSuccess, onError, disabled }: OrangeMoneyFormProps) {
  const { t } = useLanguageStore()

  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<OrangeMoneyStatus | 'idle'>('idle')
  const [transactionId, setTransactionId] = useState('')

  // ── Phone number validation (Cameroon format) ──────────────────────────
  const cleanPhone = phone.replace(/\s/g, '')
  const isValidPhone = /^6[0-9]{8}$/.test(cleanPhone)

  // ── Format display phone ───────────────────────────────────────────────
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }

  // ── Initiate payment ──────────────────────────────────────────────────
  const handlePay = async () => {
    if (!isValidPhone || disabled) return

    setStatus('pending')

    try {
      // Call Supabase Edge Function to initiate Orange Money payment
      if (supabase) {
        const { data, error } = await supabase.functions.invoke('orange-money-pay', {
          body: {
            phone: `237${cleanPhone}`,  // full international format
            amount,
            currency: 'XAF',
            amountUSD,
            description,
          },
        })

        if (error) throw new Error(error.message)

        const txId = data?.transactionId || `OM-${Date.now()}`
        setTransactionId(txId)

        // Start polling for payment confirmation
        pollPaymentStatus(txId)
      } else {
        // Simulation mode (no Supabase)
        const txId = `OM-SIM-${Date.now()}`
        setTransactionId(txId)
        // Simulate success after 3 seconds
        setTimeout(() => {
          setStatus('success')
          onSuccess(txId)
        }, 3000)
      }
    } catch (err) {
      setStatus('failed')
      onError(err instanceof Error ? err.message : 'Payment failed')
    }
  }

  // ── Poll payment status ───────────────────────────────────────────────
  const pollPaymentStatus = async (txId: string) => {
    let attempts = 0
    const maxAttempts = 30 // 30 × 2s = 60s max wait

    const poll = async () => {
      attempts++
      try {
        if (supabase) {
          const { data } = await supabase.functions.invoke('payment-status', {
            body: { transactionId: txId, gateway: 'orange_money' },
          })

          if (data?.status === 'success') {
            setStatus('success')
            onSuccess(txId)
            return
          }

          if (data?.status === 'failed') {
            setStatus('failed')
            onError(data?.message || 'Payment rejected')
            return
          }
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          setStatus('expired')
          onError('Payment confirmation timeout')
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          setStatus('failed')
          onError('Failed to check payment status')
        }
      }
    }

    setTimeout(poll, 2000)
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 10,
    border: `2px solid ${isValidPhone ? '#2563eb' : '#e2e8f0'}`,
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s',
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 16,
    fontWeight: 500,
    color: '#1e293b',
    backgroundColor: 'transparent',
    fontVariantNumeric: 'tabular-nums',
  }

  const prefixStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
    whiteSpace: 'nowrap',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 20px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: isValidPhone && status === 'idle' ? '#f97316' : '#e2e8f0',
    color: isValidPhone && status === 'idle' ? '#ffffff' : '#94a3b8',
    fontSize: 15,
    fontWeight: 600,
    cursor: isValidPhone && status === 'idle' ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background-color 0.2s, color 0.2s',
  }

  const hintStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#94a3b8',
    margin: 0,
  }

  const waitingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  }

  const maxItBannerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
  }

  // ── Waiting for USSD confirmation ─────────────────────────────────────
  if (status === 'pending') {
    return (
      <div style={waitingStyle}>
        <Loader2 size={32} color="#f97316" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {t.billing.waitingConfirmation}
        </p>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          {cleanPhone ? `+237 ${formatPhone(cleanPhone)}` : ''}
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Success state ─────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={{ ...waitingStyle, padding: '24px 16px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          backgroundColor: '#f0fdf4', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Smartphone size={24} color="#16a34a" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#16a34a', margin: 0 }}>
          {t.billing.paymentSuccess}
        </p>
        {transactionId && (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            Ref: {transactionId}
          </p>
        )}
      </div>
    )
  }

  // ── Failed / expired state ────────────────────────────────────────────
  if (status === 'failed' || status === 'expired') {
    return (
      <div style={formStyle}>
        <div style={{
          padding: '16px',
          borderRadius: 10,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#dc2626', margin: '0 0 8px', fontWeight: 600 }}>
            {t.billing.paymentFailed}
          </p>
          <button
            onClick={() => { setStatus('idle'); setPhone('') }}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid #e2e8f0', backgroundColor: '#ffffff',
              color: '#1e293b', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t.common.retry}
          </button>
        </div>
      </div>
    )
  }

  // ── Default: phone input form ─────────────────────────────────────────
  return (
    <div style={formStyle}>
      {/* Phone input */}
      <div>
        <div style={inputContainerStyle}>
          <Smartphone size={18} color="#64748b" />
          <span style={prefixStyle}>+237</span>
          <input
            style={inputStyle}
            type="tel"
            placeholder="6XX XXX XXX"
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            maxLength={11} // 9 digits + 2 spaces
            disabled={disabled}
          />
        </div>
        <p style={hintStyle}>{t.billing.phoneFormat}</p>
      </div>

      {/* Amount display */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>{t.billing.amount}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
          {amount.toLocaleString()} XAF
        </span>
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={!isValidPhone || disabled}
        style={buttonStyle}
      >
        <Smartphone size={18} />
        {t.billing.confirmPayment}
      </button>

      {/* Max IT virtual card banner */}
      <div style={maxItBannerStyle}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: '#f97316', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CardIcon size={18} color="#ffffff" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#9a3412', margin: '0 0 2px' }}>
            {t.billing.getVirtualCard}
          </p>
          <p style={{ fontSize: 11, color: '#c2410c', margin: 0, lineHeight: 1.4 }}>
            {t.billing.maxItDescription}
          </p>
        </div>
        <a
          href={MAX_IT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8,
            backgroundColor: '#ffffff', border: '1px solid #fed7aa',
            color: '#f97316', flexShrink: 0,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  )
}
