import React, { useState, useMemo, useRef } from 'react'
import {
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  Columns,
  Trash2,
  Mail,
  Share2,
  FileText,
  Heart,
  ShoppingCart,
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
import { exportReceipt, generateReceiptHTML } from '../../utils/pdfExport'
import type { PaymentMethod, OrderPayment, Order } from '../../types'

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

const TIP_PRESETS = [0, 5, 10, 15, 20] as const

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

  // Tips state
  const [tipPercent, setTipPercent] = useState<number>(0)
  const [customTip, setCustomTip] = useState('')
  const [tipMode, setTipMode] = useState<'preset' | 'custom'>('preset')

  // E-receipt state
  const [receiptEmail, setReceiptEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const lastOrderRef = useRef<Order | null>(null)

  // i18n fallback for keys
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

  const tipL = {
    tip: posLabel.tip || 'Tip',
    addTip: posLabel.addTip || 'Add a tip',
    tipAmount: posLabel.tipAmount || 'Tip amount',
    customTip: posLabel.customTip || 'Custom',
    noTip: posLabel.noTip || 'No tip',
    tipIncluded: posLabel.tipIncluded || 'Tip included',
  }

  const receiptL = {
    sendByEmail: posLabel.sendByEmail || 'Send by email',
    downloadReceipt: posLabel.downloadReceipt || 'Download PDF',
    shareReceipt: posLabel.shareReceipt || 'Share',
    enterEmail: posLabel.enterEmail || 'Email address',
    newOrder: posLabel.newOrder || 'New order',
    receiptActions: posLabel.receiptActions || 'Receipt',
    receiptSent: posLabel.receiptSent || 'Sent!',
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

  // Tip calculation
  const tipAmount = useMemo(() => {
    if (tipMode === 'custom') return Math.max(0, parseFloat(customTip) || 0)
    return Math.round(total * (tipPercent / 100))
  }, [tipPercent, customTip, tipMode, total])

  const grandTotalWithTip = total + tipAmount

  // Split payment calculations
  const splitTotal = useMemo(() =>
    splitPayments.reduce((sum, p) => sum + p.amount, 0),
  [splitPayments])

  const splitRemaining = grandTotalWithTip - splitTotal

  const changeDue = useMemo(() => {
    if (isSplitMode) return Math.max(0, splitTotal - grandTotalWithTip)
    const received = parseFloat(amountReceived) || 0
    return Math.max(0, received - grandTotalWithTip)
  }, [amountReceived, grandTotalWithTip, isSplitMode, splitTotal])

  const canConfirm = useMemo(() => {
    if (isSplitMode) {
      return splitPayments.length >= 2 && Math.abs(splitRemaining) < 1
    }
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived) || 0
      return received >= grandTotalWithTip
    }
    return true
  }, [paymentMethod, amountReceived, grandTotalWithTip, isSplitMode, splitPayments, splitRemaining])

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
      setSplitPayments([{ method: paymentMethod, amount: grandTotalWithTip }])
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
        tip_amount: tipAmount > 0 ? tipAmount : undefined,
      })

      lastOrderRef.current = order

      // Record customer visit + loyalty points
      if (selectedCustomer) {
        recordVisit(selectedCustomer.id, order.total).catch(() => {})
      }

      // Increment promotion usage
      for (const applied of promoResult.applied) {
        incrementUsage(applied.promotion.id).catch(() => {})
      }

      // Pre-fill email from customer
      if (selectedCustomer?.email) {
        setReceiptEmail(selectedCustomer.email)
      }

      setSuccess(true)
      // No auto-close — let user interact with receipt actions
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewOrder = () => {
    clear()
    selectCustomer(null)
    setSuccess(false)
    setAmountReceived('')
    setIsSplitMode(false)
    setSplitPayments([])
    setTipPercent(0)
    setCustomTip('')
    setTipMode('preset')
    setReceiptEmail('')
    setEmailSent(false)
    lastOrderRef.current = null
    onClose()
  }

  const handleClose = () => {
    if (!loading) {
      if (success) {
        handleNewOrder()
      } else {
        setAmountReceived('')
        setError('')
        setSuccess(false)
        setIsSplitMode(false)
        setSplitPayments([])
        setTipPercent(0)
        setCustomTip('')
        setTipMode('preset')
        onClose()
      }
    }
  }

  // Receipt actions
  const handleDownloadPDF = () => {
    const order = lastOrderRef.current
    if (!order || !currentStore) return
    exportReceipt(
      order,
      currentStore.name,
      currentStore.address,
      currentStore.phone,
      user?.name
    )
  }

  const handleSendEmail = () => {
    const order = lastOrderRef.current
    if (!order || !currentStore || !receiptEmail) return

    const html = generateReceiptHTML(
      order,
      currentStore.name,
      currentStore.address,
      currentStore.phone,
      user?.name,
      currency
    )

    // Build plain text fallback for mailto
    const lines = [
      `${receiptL.receiptActions} - ${currentStore.name}`,
      '',
      `N° ${order.id.slice(0, 8).toUpperCase()}`,
      `Date: ${new Date(order.created_at).toLocaleString()}`,
      '',
      ...order.items.map(it => `${it.name} x${it.qty} — ${formatCurrency(it.price * it.qty, currency)}`),
      '',
      `Total: ${formatCurrency(order.total, currency)}`,
      order.tip_amount ? `${tipL.tip}: ${formatCurrency(order.tip_amount, currency)}` : '',
      '',
      currentStore.name,
    ].filter(Boolean).join('\n')

    const subject = encodeURIComponent(`${receiptL.receiptActions} #${order.id.slice(0, 8).toUpperCase()} - ${currentStore.name}`)
    const body = encodeURIComponent(lines)
    window.open(`mailto:${receiptEmail}?subject=${subject}&body=${body}`, '_blank')
    setEmailSent(true)

    // Also try to copy HTML to clipboard for pasting
    try {
      navigator.clipboard.writeText(html).catch(() => {})
    } catch { /* ignore */ }
  }

  const handleShare = async () => {
    const order = lastOrderRef.current
    if (!order || !currentStore) return

    const text = [
      `${receiptL.receiptActions} - ${currentStore.name}`,
      `N° ${order.id.slice(0, 8).toUpperCase()}`,
      ...order.items.map(it => `${it.name} x${it.qty} — ${formatCurrency(it.price * it.qty, currency)}`),
      `Total: ${formatCurrency(order.total, currency)}`,
      order.tip_amount ? `${tipL.tip}: ${formatCurrency(order.tip_amount, currency)}` : '',
    ].filter(Boolean).join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ title: `${receiptL.receiptActions} #${order.id.slice(0, 8).toUpperCase()}`, text })
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text)
      } catch { /* ignore */ }
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
  const splitBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px 16px', borderRadius: 10, border: `2px dashed ${isSplitMode ? C.primary : C.border}`, backgroundColor: isSplitMode ? C.primary + '08' : 'transparent', color: isSplitMode ? C.primary : C.textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s' }

  // ── Success Screen with Receipt Actions ─────────────────────────────────

  if (success) {
    const order = lastOrderRef.current
    const actionBtnStyle = (color: string): React.CSSProperties => ({
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '12px 8px',
      borderRadius: 10,
      border: `1px solid ${color}20`,
      backgroundColor: color + '08',
      color,
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    })

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title={t.pos.paymentTitle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', textAlign: 'center' }}>
          <CheckCircle2 size={56} color={C.success} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '12px 0 4px' }}>
            {t.pos.paymentConfirmed}
          </h3>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: '0 0 4px' }}>
            {t.pos.orderCreated}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '4px 0' }}>
            {formatCurrency(order?.total ?? 0, currency)}
          </p>

          {/* Change due for cash */}
          {!isSplitMode && paymentMethod === 'cash' && changeDue > 0 && (
            <p style={{ color: C.success, fontSize: 16, fontWeight: 700, margin: '4px 0' }}>
              {t.pos.changeDue} : {formatCurrency(changeDue, currency)}
            </p>
          )}

          {/* Tip display */}
          {tipAmount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: '#e11d48', fontSize: 14, fontWeight: 600 }}>
              <Heart size={16} />
              {tipL.tip} : {formatCurrency(tipAmount, currency)}
            </div>
          )}

          {/* Split payment breakdown */}
          {isSplitMode && (
            <div style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>
              {splitPayments.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                  {paymentIcons[p.method]}
                  <span>{paymentLabels[p.method]}: {formatCurrency(p.amount, currency)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Receipt Actions */}
          <div style={{ width: '100%', marginTop: 20 }}>
            <p style={{ ...sectionTitleStyle, textAlign: 'center' }}>{receiptL.receiptActions}</p>

            {/* Email input row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="email"
                placeholder={receiptL.enterEmail}
                value={receiptEmail}
                onChange={(e) => { setReceiptEmail(e.target.value); setEmailSent(false) }}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${C.border}`, fontSize: 13,
                  color: C.text, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={!receiptEmail || !/\S+@\S+\.\S+/.test(receiptEmail)}
                style={{
                  padding: '10px 14px', borderRadius: 8, border: 'none',
                  backgroundColor: emailSent ? C.success : C.primary,
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: receiptEmail && /\S+@\S+\.\S+/.test(receiptEmail) ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 4,
                  opacity: receiptEmail && /\S+@\S+\.\S+/.test(receiptEmail) ? 1 : 0.5,
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                <Mail size={14} />
                {emailSent ? receiptL.receiptSent : receiptL.sendByEmail}
              </button>
            </div>

            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={actionBtnStyle(C.primary)} onClick={handleDownloadPDF}>
                <FileText size={20} />
                {receiptL.downloadReceipt}
              </button>
              <button type="button" style={actionBtnStyle('#8b5cf6')} onClick={handleShare}>
                <Share2 size={20} />
                {receiptL.shareReceipt}
              </button>
            </div>
          </div>

          {/* New Order button */}
          <button
            type="button"
            onClick={handleNewOrder}
            style={{
              width: '100%', marginTop: 20, padding: '14px 20px', borderRadius: 10,
              border: 'none', backgroundColor: C.success, color: '#fff',
              fontSize: 16, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <ShoppingCart size={18} />
            {receiptL.newOrder}
          </button>
        </div>
      </Modal>
    )
  }

  // ── Render: Tip Section ─────────────────────────────────────────────────

  const renderTipSection = () => {
    const tipBtnStyle = (isActive: boolean): React.CSSProperties => ({
      flex: 1,
      padding: '8px 4px',
      borderRadius: 8,
      border: `2px solid ${isActive ? '#e11d48' : C.border}`,
      backgroundColor: isActive ? '#e11d4810' : 'transparent',
      color: isActive ? '#e11d48' : C.textSecondary,
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s',
    })

    return (
      <div style={{ marginBottom: 16 }}>
        <p style={sectionTitleStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Heart size={14} /> {tipL.addTip}
          </span>
        </p>

        {/* Preset tip buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {TIP_PRESETS.map(pct => (
            <button
              key={pct}
              type="button"
              style={tipBtnStyle(tipMode === 'preset' && tipPercent === pct)}
              onClick={() => { setTipMode('preset'); setTipPercent(pct); setCustomTip('') }}
            >
              {pct === 0 ? tipL.noTip : `${pct}%`}
            </button>
          ))}
          <button
            type="button"
            style={tipBtnStyle(tipMode === 'custom')}
            onClick={() => { setTipMode('custom'); setTipPercent(0) }}
          >
            {tipL.customTip}
          </button>
        </div>

        {/* Custom tip input */}
        {tipMode === 'custom' && (
          <input
            type="number"
            placeholder={tipL.tipAmount}
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            min={0}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: `1px solid #e11d4840`, fontSize: 14, fontWeight: 600,
              color: C.text, outline: 'none', boxSizing: 'border-box',
            }}
          />
        )}

        {/* Tip amount display */}
        {tipAmount > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px', borderRadius: 8, marginTop: 8,
            backgroundColor: '#e11d4808', border: '1px solid #e11d4820',
          }}>
            <span style={{ fontSize: 13, color: '#e11d48', fontWeight: 600 }}>
              {tipL.tipIncluded}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e11d48' }}>
              +{formatCurrency(tipAmount, currency)}
            </span>
          </div>
        )}
      </div>
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

      {/* Tip Section */}
      {renderTipSection()}

      {/* Grand Total with Tip */}
      {tipAmount > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          backgroundColor: '#e11d4808', border: '1px solid #e11d4820',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
            {t.pos.grandTotal} + {tipL.tip}
          </span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#e11d48' }}>
            {formatCurrency(grandTotalWithTip, currency)}
          </span>
        </div>
      )}

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
