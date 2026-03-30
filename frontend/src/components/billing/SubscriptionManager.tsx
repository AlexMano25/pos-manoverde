import React, { useEffect, useState } from 'react'
import { Crown, Check, ArrowRight, Zap, Star, Building2, CreditCard } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useAuthStore } from '../../stores/authStore'
import { useLanguageStore } from '../../stores/languageStore'
import { useResponsive } from '../../hooks/useLayoutMode'
import { supabase, isSupabaseConfigured } from '../../services/supabase'
import { formatCurrency } from '../../utils/currency'
import PaymentMethodSelector from './PaymentMethodSelector'
import { sendBillingInvoice } from '../../utils/billingInvoice'
import type { Subscription, SubscriptionPlan, BillingCycle, PayPalResult } from '../../types'

// ---------------------------------------------------------------------------
// Subscription Manager — shows current plan, allows upgrade/downgrade/pay
// Integrated into BillingPage as a card above the credit balance
// ---------------------------------------------------------------------------

const C = {
  primary: '#2563eb',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#f59e0b',
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const

const PLANS: {
  id: SubscriptionPlan
  icon: React.ReactNode
  color: string
  priceMonthly: number
  priceYearly: number
  features: number
}[] = [
  { id: 'free', icon: <Zap size={20} />, color: '#64748b', priceMonthly: 0, priceYearly: 0, features: 5 },
  { id: 'starter', icon: <Star size={20} />, color: '#2563eb', priceMonthly: 9900, priceYearly: 99000, features: 10 },
  { id: 'pro', icon: <Crown size={20} />, color: '#7c3aed', priceMonthly: 29900, priceYearly: 299000, features: 15 },
  { id: 'enterprise', icon: <Building2 size={20} />, color: '#0f766e', priceMonthly: 0, priceYearly: 0, features: 20 },
  { id: 'pay_as_you_grow', icon: <CreditCard size={20} />, color: '#f59e0b', priceMonthly: 0, priceYearly: 0, features: 15 },
]

export default function SubscriptionManager() {
  const { currentStore } = useAppStore()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const { isMobile, rv } = useResponsive()

  const sub = t.subscription
  const billing = t.billing

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [showPayment, setShowPayment] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const orgId = currentStore?.organization_id

  // ── Fetch current subscription ────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !orgId) {
      setLoading(false)
      return
    }

    async function fetchSubscription() {
      setLoading(true)
      try {
        const { data } = await supabase!
          .from('subscriptions')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data) setSubscription(data as Subscription)
      } catch (err) {
        console.error('[SubscriptionManager] Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [orgId])

  // ── Helpers ────────────────────────────────────────────────────────────

  const getPlanLabel = (plan: SubscriptionPlan): string => {
    const map: Record<SubscriptionPlan, string> = {
      free: sub.free,
      starter: sub.starter,
      pro: sub.pro,
      enterprise: sub.enterprise,
      pay_as_you_grow: sub.payAsYouGrow,
    }
    return map[plan] || plan
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      active: { label: sub.planActive, color: C.success },
      past_due: { label: sub.planPastDue, color: C.warning },
      cancelled: { label: sub.planCancelled, color: C.danger },
      trial: { label: sub.planTrial, color: C.primary },
    }
    const s = map[status] || { label: status, color: C.textSecondary }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 20,
        fontSize: 12, fontWeight: 600,
        color: s.color, backgroundColor: s.color + '15',
      }}>
        {s.label}
      </span>
    )
  }

  const currentPlan = subscription?.plan || 'free'
  const planInfo = PLANS.find(p => p.id === currentPlan) || PLANS[0]

  // ── Payment success handler ───────────────────────────────────────────
  const handlePaymentSuccess = async (result: PayPalResult | string) => {
    const ref = typeof result === 'string' ? result : (result.subscriptionId || result.orderId || '')
    console.log('[SubscriptionManager] Payment success:', ref)

    if (supabase && orgId && selectedPlan) {
      try {
        await supabase
          .from('subscriptions')
          .update({
            plan: selectedPlan,
            billing_cycle: billingCycle,
            payment_method: typeof result === 'string' ? 'orange_money' : 'paypal',
            status: 'active',
            price_fcfa: billingCycle === 'monthly'
              ? PLANS.find(p => p.id === selectedPlan)?.priceMonthly || 0
              : PLANS.find(p => p.id === selectedPlan)?.priceYearly || 0,
          })
          .eq('organization_id', orgId)

        // Refresh
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (data) setSubscription(data as Subscription)
      } catch (err) {
        console.error('[SubscriptionManager] Update failed:', err)
      }
    }

    // Send invoice email (non-blocking)
    if (user?.email && selectedPlan && ref !== 'free_switch') {
      const planData = PLANS.find(p => p.id === selectedPlan)
      const amount = billingCycle === 'monthly'
        ? (planData?.priceMonthly || 0)
        : (planData?.priceYearly || 0)

      sendBillingInvoice({
        customerName: user.name || user.email,
        customerEmail: user.email,
        organizationName: currentStore?.name,
        type: 'subscription',
        planName: getPlanLabel(selectedPlan),
        billingCycle,
        amountXAF: amount,
        amountUSD: Math.round(amount / 600 * 100) / 100,
        transactionId: ref,
        paymentMethod: typeof result === 'string' ? 'Orange Money / MTN MoMo' : 'PayPal',
      })
    }

    setSuccessMsg(billing.paymentSuccess)
    setShowPayment(false)
    setShowPlanModal(false)

    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return null

  if (!subscription) return null

  // ── Styles ────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: rv(16, 20, 24),
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: `1px solid ${C.border}`,
    marginBottom: 24,
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Current subscription card */}
      <div style={cardStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 12,
        }}>
          {/* Plan info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              backgroundColor: planInfo.color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: planInfo.color,
            }}>
              {planInfo.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  {sub.currentPlan}: {getPlanLabel(currentPlan)}
                </p>
                {getStatusBadge(subscription.status)}
              </div>
              <p style={{ fontSize: 13, color: C.textSecondary, margin: '2px 0 0' }}>
                {subscription.price_fcfa > 0 && (
                  <>
                    {formatCurrency(subscription.price_fcfa, 'XAF')}
                    {subscription.billing_cycle === 'monthly' ? sub.perMonth : sub.perYear}
                    {' · '}
                  </>
                )}
                {subscription.current_period_end && (
                  <>
                    {sub.expiresOn}: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subscription.status === 'past_due' && (
              <button
                onClick={() => {
                  setSelectedPlan(currentPlan)
                  setShowPayment(true)
                  setShowPlanModal(true)
                }}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  backgroundColor: C.danger, color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <CreditCard size={14} />
                {sub.payNow}
              </button>
            )}
            <button
              onClick={() => {
                setSelectedPlan(null)
                setShowPayment(false)
                setShowPlanModal(true)
              }}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${C.border}`,
                backgroundColor: '#fff', color: C.text,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {sub.changePlan}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            backgroundColor: '#f0fdf4', color: C.success,
            fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Check size={16} />
            {successMsg}
          </div>
        )}
      </div>

      {/* ── Plan selection modal ──────────────────────────────────────── */}
      {showPlanModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? 8 : 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPlanModal(false)
              setShowPayment(false)
            }
          }}
        >
          <div style={{
            backgroundColor: '#fff',
            maxWidth: showPayment ? 520 : 680,
            width: '100%', maxHeight: '92vh', overflowY: 'auto',
            borderRadius: 16, padding: rv(16, 24, 28),
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}>
            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16,
            }}>
              <h2 style={{ margin: 0, fontSize: rv(16, 18, 20), fontWeight: 700, color: C.text }}>
                {showPayment ? sub.payNow : sub.changePlan}
              </h2>
              <button
                onClick={() => { setShowPlanModal(false); setShowPayment(false) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 20, color: C.textSecondary, padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {showPayment && selectedPlan ? (
              /* ── Payment view ── */
              <div>
                {/* Selected plan summary */}
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  backgroundColor: '#f0f9ff', border: '1px solid #bae6fd',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 16, flexWrap: 'wrap', gap: 8,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e' }}>
                    {getPlanLabel(selectedPlan)}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0369a1' }}>
                    {formatCurrency(
                      billingCycle === 'monthly'
                        ? (PLANS.find(p => p.id === selectedPlan)?.priceMonthly || 0)
                        : (PLANS.find(p => p.id === selectedPlan)?.priceYearly || 0),
                      'XAF'
                    )}
                    {billingCycle === 'monthly' ? sub.perMonth : sub.perYear}
                  </span>
                </div>

                <PaymentMethodSelector
                  context="subscription"
                  selectedPackage={{
                    id: selectedPlan,
                    label: selectedPlan,
                    amountXAF: billingCycle === 'monthly'
                      ? (PLANS.find(p => p.id === selectedPlan)?.priceMonthly || 0)
                      : (PLANS.find(p => p.id === selectedPlan)?.priceYearly || 0),
                    amountUSD: Math.round((billingCycle === 'monthly'
                      ? (PLANS.find(p => p.id === selectedPlan)?.priceMonthly || 0)
                      : (PLANS.find(p => p.id === selectedPlan)?.priceYearly || 0)) / 600 * 100) / 100,
                    tickets: 0,
                  }}
                  onPayPalSuccess={(result) => handlePaymentSuccess(result)}
                  onOrangeMoneySuccess={(txId) => handlePaymentSuccess(txId)}
                  onError={(err) => console.error('[SubscriptionManager] Payment error:', err)}
                  defaultGateway="orange_money"
                />

                <button
                  onClick={() => setShowPayment(false)}
                  style={{
                    marginTop: 12, padding: '8px 16px', borderRadius: 8,
                    border: `1px solid ${C.border}`, backgroundColor: '#fff',
                    color: C.textSecondary, fontSize: 13, cursor: 'pointer', width: '100%',
                  }}
                >
                  ← {t.common.back}
                </button>
              </div>
            ) : (
              /* ── Plan selection view ── */
              <div>
                {/* Billing cycle toggle */}
                <div style={{
                  display: 'flex', gap: 4, backgroundColor: '#f1f5f9',
                  borderRadius: 10, padding: 4, marginBottom: 20,
                }}>
                  {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                        backgroundColor: billingCycle === cycle ? '#fff' : 'transparent',
                        color: billingCycle === cycle ? C.primary : C.textSecondary,
                        fontSize: 13, fontWeight: billingCycle === cycle ? 600 : 500,
                        cursor: 'pointer',
                        boxShadow: billingCycle === cycle ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      {cycle === 'monthly' ? sub.monthlyBilling : sub.yearlyBilling}
                      {cycle === 'yearly' && (
                        <span style={{
                          marginLeft: 6, fontSize: 11, fontWeight: 600,
                          color: C.success, backgroundColor: C.success + '15',
                          padding: '2px 6px', borderRadius: 10,
                        }}>
                          {sub.yearlyDiscount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Plan cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: 12,
                }}>
                  {PLANS.filter(p => p.id !== 'pay_as_you_grow' && p.id !== 'enterprise').map((plan) => {
                    const isCurrent = currentPlan === plan.id
                    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
                    const isPopular = plan.id === 'pro'

                    return (
                      <div
                        key={plan.id}
                        style={{
                          padding: 16, borderRadius: 12,
                          border: `2px solid ${isCurrent ? plan.color : selectedPlan === plan.id ? C.primary : C.border}`,
                          backgroundColor: isCurrent ? plan.color + '08' : '#fff',
                          cursor: isCurrent ? 'default' : 'pointer',
                          position: 'relative',
                          transition: 'border-color 0.15s',
                        }}
                        onClick={() => {
                          if (!isCurrent) setSelectedPlan(plan.id)
                        }}
                      >
                        {/* Popular badge */}
                        {isPopular && (
                          <span style={{
                            position: 'absolute', top: -10, right: 12,
                            padding: '2px 10px', borderRadius: 10,
                            backgroundColor: plan.color, color: '#fff',
                            fontSize: 11, fontWeight: 600,
                          }}>
                            {sub.recommended}
                          </span>
                        )}

                        {/* Current badge */}
                        {isCurrent && (
                          <span style={{
                            position: 'absolute', top: -10, left: 12,
                            padding: '2px 10px', borderRadius: 10,
                            backgroundColor: C.success, color: '#fff',
                            fontSize: 11, fontWeight: 600,
                          }}>
                            ✓ {sub.currentLabel}
                          </span>
                        )}

                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          marginBottom: 8, marginTop: (isCurrent || isPopular) ? 4 : 0,
                        }}>
                          <div style={{ color: plan.color }}>{plan.icon}</div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                            {getPlanLabel(plan.id)}
                          </span>
                        </div>

                        <p style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
                          {price === 0 ? sub.free : formatCurrency(price, 'XAF')}
                          {price > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: C.textSecondary }}>
                              {billingCycle === 'monthly' ? sub.perMonth : sub.perYear}
                            </span>
                          )}
                        </p>

                        <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>
                          {plan.features} {t.landing?.planFeature1 || 'features'}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Confirm button */}
                {selectedPlan && selectedPlan !== currentPlan && (
                  <button
                    onClick={() => {
                      const plan = PLANS.find(p => p.id === selectedPlan)
                      if (plan && plan.priceMonthly > 0) {
                        setShowPayment(true)
                      } else {
                        // Free plan — just update
                        handlePaymentSuccess('free_switch')
                      }
                    }}
                    style={{
                      marginTop: 16, width: '100%', padding: '12px 20px',
                      borderRadius: 10, border: 'none',
                      backgroundColor: C.primary, color: '#fff',
                      fontSize: 15, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {selectedPlan === 'free' ? sub.selectPlan : sub.payNow}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
