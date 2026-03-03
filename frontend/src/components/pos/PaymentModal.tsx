import React, { useState, useMemo } from 'react'
import {
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import Modal from '../common/Modal'
import { useCartStore } from '../../stores/cartStore'
import { useOrderStore } from '../../stores/orderStore'
import { useAuthStore } from '../../stores/authStore'
import { useAppStore } from '../../stores/appStore'
import { useLanguageStore } from '../../stores/languageStore'
import { formatCurrency } from '../../utils/currency'
import type { PaymentMethod } from '../../types'

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

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote size={20} />,
  card: <CreditCard size={20} />,
  momo: <Smartphone size={20} />,
  transfer: <ArrowRightLeft size={20} />,
  orange_money: <Smartphone size={20} />,
  mtn_money: <Smartphone size={20} />,
  carte_bancaire: <CreditCard size={20} />,
}

// ── Props ────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  paymentMethod: PaymentMethod
}

// ── Component ────────────────────────────────────────────────────────────

export default function PaymentModal({ isOpen, onClose, paymentMethod }: PaymentModalProps) {
  const { items, getTotal, clear } = useCartStore()
  const { createOrder } = useOrderStore()
  const { user } = useAuthStore()
  const { currentStore } = useAppStore()
  const { t } = useLanguageStore()

  const [amountReceived, setAmountReceived] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const paymentLabels: Record<PaymentMethod, string> = {
    cash: t.pos.cash,
    card: t.pos.card,
    momo: t.pos.momo,
    transfer: t.pos.transfer,
    orange_money: t.pos.orangeMoney,
    mtn_money: t.pos.mtnMoney,
    carte_bancaire: t.pos.carteBancaire,
  }

  const subtotal = getTotal()
  const discount = 0
  const taxRate = currentStore?.tax_rate ?? 0
  const tax = Math.round(subtotal * (taxRate / 100))
  const total = subtotal - discount + tax

  const changeDue = useMemo(() => {
    const received = parseFloat(amountReceived) || 0
    return Math.max(0, received - total)
  }, [amountReceived, total])

  const canConfirm = useMemo(() => {
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0
      return received >= total
    }
    return true
  }, [paymentMethod, amountReceived, total])

  const handleConfirm = async () => {
    if (!user || !currentStore) return
    setLoading(true)
    setError('')

    try {
      await createOrder(items, paymentMethod, user.id, currentStore.id)
      setSuccess(true)
      setTimeout(() => {
        clear()
        setSuccess(false)
        setAmountReceived('')
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setAmountReceived('')
      setError('')
      setSuccess(false)
      onClose()
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  const sectionStyle: React.CSSProperties = { marginBottom: 20 }
  const sectionTitleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, margin: '0 0 10px' }
  const itemRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 14, color: C.text }
  const dividerStyle: React.CSSProperties = { height: 1, backgroundColor: C.border, margin: '12px 0' }
  const totalRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 20, fontWeight: 700, color: C.text }
  const paymentMethodBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, backgroundColor: C.primary + '10', color: C.primary, fontWeight: 600, fontSize: 14 }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 16, fontWeight: 600, color: C.text, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }
  const changeBoxStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, backgroundColor: changeDue > 0 ? C.success + '10' : C.bg, marginTop: 10 }
  const confirmBtnStyle: React.CSSProperties = { width: '100%', padding: '14px 20px', borderRadius: 10, border: 'none', backgroundColor: canConfirm ? C.primary : '#94a3b8', color: '#ffffff', fontSize: 16, fontWeight: 700, cursor: canConfirm && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10, transition: 'background-color 0.2s', opacity: loading ? 0.7 : 1 }
  const cancelBtnStyle: React.CSSProperties = { width: '100%', padding: '12px 20px', borderRadius: 10, border: 'none', backgroundColor: 'transparent', color: C.textSecondary, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }
  const errorStyle: React.CSSProperties = { backgroundColor: '#fef2f2', color: C.danger, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: 'center' }
  const successOverlayStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={t.pos.paymentTitle}>
        <div style={successOverlayStyle}>
          <CheckCircle2 size={64} color={C.success} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '16px 0 4px' }}>
            {t.pos.paymentConfirmed}
          </h3>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: 0 }}>
            {t.pos.orderCreated}
          </p>
          {paymentMethod === 'cash' && changeDue > 0 && (
            <p style={{ color: C.success, fontSize: 18, fontWeight: 700, marginTop: 12 }}>
              {t.pos.changeDue} : {formatCurrency(changeDue, currentStore?.currency)}
            </p>
          )}
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t.pos.confirmPayment}>
      {/* Order Summary */}
      <div style={sectionStyle}>
        <p style={sectionTitleStyle}>{t.pos.orderSummary}</p>
        {items.map((item) => (
          <div key={item.product_id} style={itemRowStyle}>
            <span>
              {item.name} <span style={{ color: C.textSecondary }}>x{item.qty}</span>
            </span>
            <span style={{ fontWeight: 500 }}>{formatCurrency(item.price * item.qty, currentStore?.currency)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={dividerStyle} />
      <div style={itemRowStyle}>
        <span style={{ color: C.textSecondary }}>{t.pos.subtotal}</span>
        <span>{formatCurrency(subtotal, currentStore?.currency)}</span>
      </div>
      {discount > 0 && (
        <div style={itemRowStyle}>
          <span style={{ color: C.textSecondary }}>{t.pos.discount}</span>
          <span style={{ color: C.danger }}>-{formatCurrency(discount, currentStore?.currency)}</span>
        </div>
      )}
      {tax > 0 && (
        <div style={itemRowStyle}>
          <span style={{ color: C.textSecondary }}>{t.pos.tax} ({taxRate}%)</span>
          <span>{formatCurrency(tax, currentStore?.currency)}</span>
        </div>
      )}
      <div style={dividerStyle} />
      <div style={totalRowStyle}>
        <span>{t.pos.grandTotal}</span>
        <span>{formatCurrency(total, currentStore?.currency)}</span>
      </div>

      {/* Payment Method */}
      <div style={{ ...sectionStyle, marginTop: 16 }}>
        <p style={sectionTitleStyle}>{t.orders.paymentMethod}</p>
        <div style={paymentMethodBoxStyle}>
          {paymentIcons[paymentMethod]}
          {paymentLabels[paymentMethod]}
        </div>
      </div>

      {/* Cash-specific: Amount Received */}
      {paymentMethod === 'cash' && (
        <div style={sectionStyle}>
          <p style={sectionTitleStyle}>{t.pos.amountReceived}</p>
          <input
            style={inputStyle}
            type="number"
            placeholder={t.pos.amountReceived}
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = C.primary)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
            min={0}
            autoFocus
          />
          <div style={changeBoxStyle}>
            <span style={{ fontSize: 14, color: C.textSecondary }}>{t.pos.changeDue}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: changeDue > 0 ? C.success : C.text }}>
              {formatCurrency(changeDue, currentStore?.currency)}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div style={errorStyle}>{error}</div>}

      {/* Actions */}
      <div style={{ marginTop: 8 }}>
        <button
          style={confirmBtnStyle}
          onClick={handleConfirm}
          disabled={!canConfirm || loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              {t.pos.processing}
            </>
          ) : (
            <>
              <CheckCircle2 size={18} /> {t.pos.confirmPayment}
            </>
          )}
        </button>
        <button style={cancelBtnStyle} onClick={handleClose} disabled={loading}>
          {t.common.cancel}
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Modal>
  )
}
