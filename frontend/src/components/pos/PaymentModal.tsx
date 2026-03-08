import React, { useState, useMemo } from 'react'
import {
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  Columns,
  Trash2,
} from 'lucide-react'
import Modal from '../common/Modal'
import { useCartStore } from '../../stores/cartStore'
import { useOrderStore } from '../../stores/orderStore'
import { useAuthStore } from '../../stores/authStore'
import { useAppStore } from '../../stores/appStore'
import { useLanguageStore } from '../../stores/languageStore'
import { useCustomerStore } from '../../stores/customerStore'
import { usePromotionStore } from '../../stores/promotionStore'
import { formatCurrency } from '../../utils/currency'
import type { PaymentMethod, OrderPayment } from '../../types'

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
  paypal: <CreditCard size={20} />,
}

const AVAILABLE_METHODS: PaymentMethod[] = [
  'cash', 'card', 'momo', 'transfer', 'orange_money', 'mtn_money', 'carte_bancaire', 'paypal',
]

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
  const { selectedCustomer, selectCustomer, recordVisit } = useCustomerStore()
  const { calculateTotalDiscount, incrementUsage } = usePromotionStore()

  const [amountReceived, setAmountReceived] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isSplitMode, setIsSplitMode] = useState(false)
  const [splitPayments, setSplitPayments] = useState<OrderPayment[]>([])

  // i18n fallback for split payment keys
  const posLabel = t.pos as Record<string, string>
  const splitL = {
    splitPayment: posLabel.splitPayment || 'Split Payment',
    splitPaymentTitle: posLabel.splitPaymentTitle || 'Split Payment',
    splitPaymentDesc: posLabel.splitPaymentDesc || 'Split the total across multiple payment methods',
    addPaymentMethod: posLabel.addPaymentMethod || 'Add Payment Method',
    remainingAmount: posLabel.remainingAmount || 'Remaining',
    paymentSummary: posLabel.paymentSummary || 'Payment Summary',
    fullPayment: posLabel.fullPayment || 'Full Payment',
    paymentComplete: posLabel.paymentComplete || 'Payment Complete',
    overpayment: posLabel.overpayment || 'Overpayment',
    underpayment: posLabel.underpayment || 'Underpayment',
  }

  const paymentLabels: Record<PaymentMethod, string> = {
    cash: t.pos.cash,
    card: t.pos.card,
    momo: t.pos.momo,
    transfer: t.pos.transfer,
    orange_money: t.pos.orangeMoney,
    mtn_money: t.pos.mtnMoney,
    carte_bancaire: t.pos.carteBancaire,
    paypal: 'PayPal',
  }

  const subtotal = getTotal()
  const storeId = currentStore?.id || 'default-store'
  const currency = currentStore?.currency
  const promoResult = useMemo(
    () => calculateTotalDiscount(items, storeId),
    [items, storeId, calculateTotalDiscount]
  )
  const promoDiscount = promoResult.total
  const discount = promoDiscount
  const taxRate = currentStore?.tax_rate ?? 0
  const tax = Math.round((subtotal - discount) * (taxRate / 100))
  const total = subtotal - discount + tax

  // Split payment calculations
  const splitTotal = useMemo(() =>
    splitPayments.reduce((sum, p) => sum + p.amount, 0),
  [splitPayments])

  const splitRemaining = total - splitTotal

  const changeDue = useMemo(() => {
    if (isSplitMode) return Math.max(0, splitTotal - total)
    const received = parseFloat(amountReceived) || 0
    return Math.max(0, received - total)
  }, [amountReceived, total, isSplitMode, splitTotal])

  const canConfirm = useMemo(() => {
    if (isSplitMode) {
      return splitPayments.length >= 2 && Math.abs(splitRemaining) < 1
    }
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0
      return received >= total
    }
    return true
  }, [paymentMethod, amountReceived, total, isSplitMode, splitPayments, splitRemaining])

  // Split payment handlers
  const addSplitMethod = (method: PaymentMethod) => {
    setSplitPayments(prev => [
      ...prev,
      { method, amount: prev.length === 0 ? Math.max(0, splitRemaining) : 0 },
    ])
  }

  const updateSplitAmount = (index: number, amount: number) => {
    setSplitPayments(prev => prev.map((p, i) => i === index ? { ...p, amount } : p))
  }

  const removeSplitMethod = (index: number) => {
    setSplitPayments(prev => prev.filter((_, i) => i !== index))
  }

  const toggleSplitMode = () => {
    if (!isSplitMode) {
      // Initialize with current payment method
      setSplitPayments([{ method: paymentMethod, amount: total }])
      setIsSplitMode(true)
    } else {
      setSplitPayments([])
      setIsSplitMode(false)
    }
  }

  const handleConfirm = async () => {
    if (!user || !currentStore) return
    setLoading(true)
    setError('')

    try {
      const promoNames = promoResult.applied.map(a => a.promotion.name)

      // Determine primary method and payments array
      const primaryMethod = isSplitMode
        ? splitPayments.reduce((a, b) => a.amount >= b.amount ? a : b).method
        : paymentMethod

      const payments = isSplitMode ? splitPayments : undefined

      const order = await createOrder(items, primaryMethod, user.id, currentStore.id, {
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name,
        promotion_discount: promoDiscount > 0 ? promoDiscount : undefined,
        promotion_names: promoNames.length > 0 ? promoNames : undefined,
        payments,
      })

      // Record customer visit + loyalty points
      if (selectedCustomer) {
        recordVisit(selectedCustomer.id, order.total).catch(() => {})
      }

      // Increment promotion usage
      for (const applied of promoResult.applied) {
        incrementUsage(applied.promotion.id).catch(() => {})
      }

      setSuccess(true)
      setTimeout(() => {
        clear()
        selectCustomer(null)
        setSuccess(false)
        setAmountReceived('')
        setIsSplitMode(false)
        setSplitPayments([])
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
      setIsSplitMode(false)
      setSplitPayments([])
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
  const splitBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px 16px', borderRadius: 10, border: `2px dashed ${isSplitMode ? C.primary : C.border}`, backgroundColor: isSplitMode ? C.primary + '08' : 'transparent', color: isSplitMode ? C.primary : C.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s' }

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
          {!isSplitMode && paymentMethod === 'cash' && changeDue > 0 && (
            <p style={{ color: C.success, fontSize: 18, fontWeight: 700, marginTop: 12 }}>
              {t.pos.changeDue} : {formatCurrency(changeDue, currency)}
            </p>
          )}
          {isSplitMode && (
            <div style={{ marginTop: 12, fontSize: 13, color: C.textSecondary }}>
              {splitPayments.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                  {paymentIcons[p.method]}
                  <span>{paymentLabels[p.method]}: {formatCurrency(p.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    )
  }

  // ── Render: Split Payment Section ──────────────────────────────────────

  const renderSplitPayment = () => {
    if (!isSplitMode) return null

    const usedMethods = splitPayments.map(p => p.method)
    const availableMethods = AVAILABLE_METHODS.filter(m => !usedMethods.includes(m))

    return (
      <div style={{ marginTop: 16 }}>
        <p style={sectionTitleStyle}>{splitL.splitPaymentTitle}</p>
        <p style={{ fontSize: 12, color: C.textSecondary, margin: '0 0 12px' }}>
          {splitL.splitPaymentDesc}
        </p>

        {/* Split payment entries */}
        {splitPayments.map((payment, index) => (
          <div
            key={index}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              backgroundColor: C.bg, marginBottom: 8,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              {paymentIcons[payment.method]}
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
                {paymentLabels[payment.method]}
              </span>
            </div>
            <input
              type="number"
              value={payment.amount || ''}
              onChange={(e) => updateSplitAmount(index, Number(e.target.value) || 0)}
              style={{
                width: 100, padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600,
                color: C.text, outline: 'none', textAlign: 'right',
                boxSizing: 'border-box',
              }}
              min={0}
              placeholder="0"
            />
            {splitPayments.length > 1 && (
              <button
                type="button"
                onClick={() => removeSplitMethod(index)}
                style={{
                  padding: 6, border: 'none', borderRadius: 6,
                  backgroundColor: '#fef2f2', color: C.danger,
                  cursor: 'pointer', display: 'flex',
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Add method button */}
        {availableMethods.length > 0 && splitPayments.length < 4 && (
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addSplitMethod(e.target.value as PaymentMethod)
                  e.target.value = ''
                }
              }}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: `1px dashed ${C.border}`, fontSize: 13,
                color: C.textSecondary, backgroundColor: 'transparent',
                cursor: 'pointer', outline: 'none',
              }}
              defaultValue=""
            >
              <option value="" disabled>
                + {splitL.addPaymentMethod}
              </option>
              {availableMethods.map(m => (
                <option key={m} value={m}>{paymentLabels[m]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Remaining amount indicator */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', borderRadius: 10, marginTop: 8,
          backgroundColor: Math.abs(splitRemaining) < 1 ? C.success + '10' : (splitRemaining > 0 ? C.warning + '15' : '#fef2f2'),
          border: `1px solid ${Math.abs(splitRemaining) < 1 ? C.success + '30' : (splitRemaining > 0 ? C.warning + '30' : C.danger + '30')}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: Math.abs(splitRemaining) < 1 ? C.success : (splitRemaining > 0 ? C.warning : C.danger) }}>
            {Math.abs(splitRemaining) < 1 ? splitL.paymentComplete : (splitRemaining > 0 ? splitL.remainingAmount : splitL.overpayment)}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: Math.abs(splitRemaining) < 1 ? C.success : (splitRemaining > 0 ? C.warning : C.danger) }}>
            {formatCurrency(Math.abs(splitRemaining), currency)}
          </span>
        </div>
      </div>
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
            <span style={{ fontWeight: 500 }}>{formatCurrency(item.price * item.qty, currency)}</span>
          </div>
        ))}
      </div>

      {/* Customer info */}
      {selectedCustomer && (
        <div style={{ ...sectionStyle, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#166534' }}>{selectedCustomer.name}</div>
              <div style={{ fontSize: 12, color: '#15803d' }}>🎁 {selectedCustomer.loyalty_points} pts</div>
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div style={dividerStyle} />
      <div style={itemRowStyle}>
        <span style={{ color: C.textSecondary }}>{t.pos.subtotal}</span>
        <span>{formatCurrency(subtotal, currency)}</span>
      </div>
      {discount > 0 && (
        <div style={itemRowStyle}>
          <span style={{ color: C.textSecondary }}>
            {t.pos.discount}
            {promoResult.applied.length > 0 && (
              <span style={{ fontSize: 11, marginLeft: 4, color: '#f59e0b' }}>
                🏷 {promoResult.applied.map(a => a.promotion.name).join(', ')}
              </span>
            )}
          </span>
          <span style={{ color: C.danger }}>-{formatCurrency(discount, currency)}</span>
        </div>
      )}
      {tax > 0 && (
        <div style={itemRowStyle}>
          <span style={{ color: C.textSecondary }}>{t.pos.tax} ({taxRate}%)</span>
          <span>{formatCurrency(tax, currency)}</span>
        </div>
      )}
      <div style={dividerStyle} />
      <div style={totalRowStyle}>
        <span>{t.pos.grandTotal}</span>
        <span>{formatCurrency(total, currency)}</span>
      </div>

      {/* Split Payment Toggle */}
      <button type="button" style={splitBtnStyle} onClick={toggleSplitMode}>
        <Columns size={16} />
        {isSplitMode ? splitL.fullPayment : splitL.splitPayment}
      </button>

      {/* Payment Method (single) */}
      {!isSplitMode && (
        <>
          <div style={{ ...sectionStyle, marginTop: 0 }}>
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
                  {formatCurrency(changeDue, currency)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Split Payment Section */}
      {renderSplitPayment()}

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
