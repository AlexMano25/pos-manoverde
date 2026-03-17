import { useState } from 'react'
import { Smartphone, Loader2, Wallet } from 'lucide-react'
import { useLanguageStore } from '../../stores/languageStore'
import { supabase } from '../../services/supabase'

// ---------------------------------------------------------------------------
// MTN MoMo payment form — CamPay integration
// Initiates payment via Supabase Edge Function → CamPay collect API
// Polls for payment status confirmation
// ---------------------------------------------------------------------------

interface MtnMomoFormProps {
  amount: number           // amount in XAF
  amountUSD: number        // amount in USD (for credit_balances)
  description: string      // payment description
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
  disabled?: boolean
  organizationId?: string  // for credit tracking
}

type MtnStatus = 'idle' | 'pending' | 'success' | 'failed' | 'expired'

const MTN_YELLOW = '#FFCC00'
const MTN_BLUE = '#004F9F'

export default function MtnMomoForm({ amount, amountUSD, description, onSuccess, onError, disabled, organizationId }: MtnMomoFormProps) {
  const { t } = useLanguageStore()

  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<MtnStatus>('idle')
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
      if (supabase) {
        const { data, error } = await supabase.functions.invoke('campay-collect', {
          body: {
            phone: cleanPhone,  // 9-digit local format, edge function adds 237
            amount,
            currency: 'XAF',
            amountUSD,
            description,
            organizationId,
          },
        })

        if (error) throw new Error(error.message)

        const txId = data?.reference || data?.transactionId || `MTN-${Date.now()}`
        setTransactionId(txId)

        // Start polling for payment confirmation
        pollPaymentStatus(txId)
      } else {
        // Simulation mode (no Supabase)
        const txId = `MTN-SIM-${Date.now()}`
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
            body: { transactionId: txId, gateway: 'campay' },
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
    border: `2px solid ${isValidPhone ? MTN_BLUE : '#e2e8f0'}`,
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
    backgroundColor: isValidPhone && status === 'idle' ? MTN_YELLOW : '#e2e8f0',
    color: isValidPhone && status === 'idle' ? MTN_BLUE : '#94a3b8',
    fontSize: 15,
    fontWeight: 700,
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

  const mtnBannerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 10,
    backgroundColor: MTN_YELLOW + '18',
    border: `1px solid ${MTN_YELLOW}60`,
  }

  // ── Waiting for USSD confirmation ─────────────────────────────────────
  if (status === 'pending') {
    return (
      <div style={waitingStyle}>
        <Loader2 size={32} color={MTN_YELLOW} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>
          {t.billing.waitingConfirmation}
        </p>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
          {cleanPhone ? `+237 ${formatPhone(cleanPhone)}` : ''}
        </p>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
          {(t.billing as any).mtnConfirmOnPhone || 'Composez votre PIN MTN MoMo pour confirmer'}
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
          <Wallet size={24} color="#16a34a" />
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
        <Wallet size={18} />
        {t.billing.payWithMTN}
      </button>

      {/* MTN MoMo info banner */}
      <div style={mtnBannerStyle}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          backgroundColor: MTN_YELLOW, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Wallet size={18} color={MTN_BLUE} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: MTN_BLUE, margin: '0 0 2px' }}>
            MTN Mobile Money
          </p>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            {(t.billing as any).mtnPaymentDesc || 'Paiement securise via MTN MoMo. Un USSD sera envoye sur votre telephone.'}
          </p>
        </div>
      </div>
    </div>
  )
}
