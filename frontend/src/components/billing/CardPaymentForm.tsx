import { useState } from 'react'
import { CreditCard, Loader2, ExternalLink, ShieldCheck } from 'lucide-react'
import { useLanguageStore } from '../../stores/languageStore'
import { supabase } from '../../services/supabase'

// ---------------------------------------------------------------------------
// Card payment form — CamPay payment link integration
// Creates a CamPay payment link, opens it in a new tab,
// and polls for payment confirmation
// ---------------------------------------------------------------------------

interface CardPaymentFormProps {
  amount: number            // amount in XAF
  amountUSD: number         // amount in USD (for credit_balances)
  description: string       // payment description
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
  disabled?: boolean
  organizationId?: string   // for credit tracking
}

type CardStatus = 'idle' | 'creating_link' | 'waiting' | 'success' | 'failed'

const CAMPAY_BLUE = '#1a56db'

export default function CardPaymentForm({ amount, amountUSD, description, onSuccess, onError, disabled, organizationId }: CardPaymentFormProps) {
  const { t } = useLanguageStore()

  const [status, setStatus] = useState<CardStatus>('idle')
  const [paymentLink, setPaymentLink] = useState('')
  const [transactionId, setTransactionId] = useState('')

  // ── Create payment link and open it ──────────────────────────────────
  const handlePay = async () => {
    if (disabled) return

    setStatus('creating_link')

    try {
      if (supabase) {
        const { data, error } = await supabase.functions.invoke('campay-payment-link', {
          body: {
            amount,
            currency: 'XAF',
            amountUSD,
            description,
            organizationId,
            redirectUrl: window.location.origin + '/?payment=success',
            failureRedirectUrl: window.location.origin + '/?payment=failed',
          },
        })

        if (error) throw new Error(error.message)

        const link = data?.link
        const ref = data?.reference || data?.transactionId || `CARD-${Date.now()}`

        if (!link) throw new Error('No payment link received')

        setPaymentLink(link)
        setTransactionId(ref)
        setStatus('waiting')

        // Open payment link in new tab
        window.open(link, '_blank', 'noopener,noreferrer')

        // Start polling for payment confirmation
        pollPaymentStatus(ref)
      } else {
        // Simulation mode
        const txId = `CARD-SIM-${Date.now()}`
        setTransactionId(txId)
        setStatus('waiting')
        setTimeout(() => {
          setStatus('success')
          onSuccess(txId)
        }, 3000)
      }
    } catch (err) {
      setStatus('failed')
      onError(err instanceof Error ? err.message : 'Payment link creation failed')
    }
  }

  // ── Poll payment status ───────────────────────────────────────────────
  const pollPaymentStatus = async (ref: string) => {
    let attempts = 0
    const maxAttempts = 90 // 90 × 2s = 3 min max (card payments take longer)

    const poll = async () => {
      attempts++
      try {
        if (supabase) {
          const { data } = await supabase.functions.invoke('payment-status', {
            body: { transactionId: ref, gateway: 'campay_card' },
          })

          if (data?.status === 'success') {
            setStatus('success')
            onSuccess(ref)
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
          setStatus('failed')
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

    setTimeout(poll, 3000) // Wait 3s before first check (user needs time to load page)
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 20px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: status === 'idle' ? CAMPAY_BLUE : '#e2e8f0',
    color: status === 'idle' ? '#ffffff' : '#94a3b8',
    fontSize: 15,
    fontWeight: 600,
    cursor: status === 'idle' && !disabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background-color 0.2s, color 0.2s',
  }

  const waitingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  }

  // ── Creating link state ─────────────────────────────────────────────
  if (status === 'creating_link') {
    return (
      <div style={waitingStyle}>
        <Loader2 size={32} color={CAMPAY_BLUE} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {t.billing.openingPaymentPage}
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Waiting for card payment ────────────────────────────────────────
  if (status === 'waiting') {
    return (
      <div style={waitingStyle}>
        <Loader2 size={32} color={CAMPAY_BLUE} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {t.billing.waitingCardPayment}
        </p>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          {t.billing.cardPaymentInstructions}
        </p>

        {/* Re-open payment link button */}
        {paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${CAMPAY_BLUE}`,
              backgroundColor: '#ffffff',
              color: CAMPAY_BLUE,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <ExternalLink size={14} />
            {t.billing.openPaymentPage}
          </a>
        )}

        {transactionId && (
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            Ref: {transactionId}
          </p>
        )}
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
          <CreditCard size={24} color="#16a34a" />
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

  // ── Failed state ────────────────────────────────────────────────────
  if (status === 'failed') {
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
            onClick={() => { setStatus('idle'); setPaymentLink(''); setTransactionId('') }}
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

  // ── Default: pay button ─────────────────────────────────────────────
  return (
    <div style={formStyle}>
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
        disabled={disabled}
        style={buttonStyle}
      >
        <CreditCard size={18} />
        {t.billing.payWithCard}
      </button>

      {/* Security info banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: CAMPAY_BLUE, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ShieldCheck size={18} color="#ffffff" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', margin: '0 0 2px' }}>
            CamPay
          </p>
          <p style={{ fontSize: 11, color: '#3b82f6', margin: 0, lineHeight: 1.4 }}>
            {t.billing.cardPaymentDesc}
          </p>
        </div>
      </div>
    </div>
  )
}
