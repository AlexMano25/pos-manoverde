import { useState } from 'react'
import { CreditCard, Smartphone, Wallet } from 'lucide-react'
import { useLanguageStore } from '../../stores/languageStore'
import PayPalButton from './PayPalButton'
import OrangeMoneyForm from './OrangeMoneyForm'
import MtnMomoForm from './MtnMomoForm'
import CardPaymentForm from './CardPaymentForm'
import type { PayPalResult, PaymentGateway, RechargePackage } from '../../types'

// ---------------------------------------------------------------------------
// Unified payment method selector with 4 tabs:
// 1. Orange Money   (Cameroon) — CamPay integration
// 2. MTN MoMo       (Cameroon) — Y-Note/PayNote integration
// 3. Carte bancaire (CamPay payment link)
// 4. PayPal / Visa  (international) — PayPal account: direction@manovende.com
//
// Used in: BillingPage (recharge modal) and RegistrationPage (step 4)
// ---------------------------------------------------------------------------

interface PaymentMethodSelectorProps {
  // What we're paying for
  context: 'recharge' | 'subscription'

  // For recharge: selected package
  selectedPackage?: RechargePackage | null

  // For subscription: PayPal plan IDs
  paypalPlanId?: string

  // Callbacks
  onPayPalSuccess: (result: PayPalResult) => void
  onOrangeMoneySuccess: (transactionId: string) => void
  onMtnSuccess?: (transactionId: string) => void
  onCardSuccess?: (transactionId: string) => void
  onError: (error: string) => void

  // Optional: pre-selected gateway
  defaultGateway?: PaymentGateway

  // Optional: organization ID for credit tracking
  organizationId?: string
}

const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: 'micro',    label: 'microPack',    amountXAF: 5000,  amountUSD: 8,  tickets: 400 },
  { id: 'standard', label: 'standardPack', amountXAF: 10000, amountUSD: 16, tickets: 800 },
  { id: 'pro',      label: 'proPack',      amountXAF: 25000, amountUSD: 40, tickets: 2000 },
  { id: 'business', label: 'businessPack', amountXAF: 50000, amountUSD: 80, tickets: 4000 },
]

export { RECHARGE_PACKAGES }

export default function PaymentMethodSelector({
  context,
  selectedPackage,
  paypalPlanId,
  onPayPalSuccess,
  onOrangeMoneySuccess,
  onMtnSuccess,
  onCardSuccess,
  onError,
  defaultGateway = 'orange_money',
  organizationId,
}: PaymentMethodSelectorProps) {
  const { t } = useLanguageStore()
  const [activeTab, setActiveTab] = useState<PaymentGateway>(defaultGateway)

  const billing = t.billing

  // ── Tab definitions ────────────────────────────────────────────────────
  const tabs: { id: PaymentGateway; label: string; icon: React.ReactNode; enabled: boolean }[] = [
    { id: 'orange_money', label: billing.orangeMoney, icon: <Smartphone size={16} />, enabled: true },
    { id: 'mtn_momo', label: billing.mtnMomo, icon: <Wallet size={16} />, enabled: true },
    { id: 'carte_bancaire', label: billing.cardPayment, icon: <CreditCard size={16} />, enabled: true },
    { id: 'paypal', label: billing.paypalVisa, icon: <CreditCard size={16} />, enabled: true },
  ]

  // ── Styles ─────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
  }

  const tabStyle = (isActive: boolean, enabled: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 8px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: !enabled ? '#cbd5e1' : isActive ? '#2563eb' : '#64748b',
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.2s',
    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    opacity: enabled ? 1 : 0.5,
  })

  const contentStyle: React.CSSProperties = {
    padding: '8px 0',
    minHeight: 120,
  }

  const comingSoonStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    color: '#94a3b8',
    fontSize: 14,
    gap: 8,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: '#64748b',
    marginBottom: 8,
  }

  return (
    <div style={containerStyle}>
      {/* Payment method label */}
      <p style={labelStyle}>{billing.chooseMethod}</p>

      {/* Tab bar */}
      <div style={tabBarStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.enabled && setActiveTab(tab.id)}
            style={tabStyle(activeTab === tab.id, tab.enabled)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={contentStyle}>
        {/* ── PayPal / Visa ─────────────────────────────────────── */}
        {activeTab === 'paypal' && (
          <div>
            {context === 'subscription' && paypalPlanId ? (
              <PayPalButton
                mode="subscription"
                planId={paypalPlanId}
                onSuccess={onPayPalSuccess}
                onError={(err) => onError(err.message)}
              />
            ) : context === 'recharge' && selectedPackage ? (
              <PayPalButton
                mode="capture"
                amount={selectedPackage.amountUSD}
                onSuccess={onPayPalSuccess}
                onError={(err) => onError(err.message)}
              />
            ) : (
              <div style={comingSoonStyle}>
                <CreditCard size={24} color="#cbd5e1" />
                <span>{billing.selectAmount}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Orange Money ─────────────────────────────────────── */}
        {activeTab === 'orange_money' && (
          <div>
            {selectedPackage || (context === 'subscription') ? (
              <OrangeMoneyForm
                amount={selectedPackage?.amountXAF || 0}
                amountUSD={selectedPackage?.amountUSD || 0}
                description={context === 'subscription' ? 'POS Subscription' : `Credit recharge ${selectedPackage?.id || ''}`}
                onSuccess={onOrangeMoneySuccess}
                onError={onError}
                organizationId={organizationId}
              />
            ) : (
              <div style={comingSoonStyle}>
                <Smartphone size={24} color="#cbd5e1" />
                <span>{billing.selectAmount}</span>
              </div>
            )}
          </div>
        )}

        {/* ── MTN MoMo (Y-Note / PayNote) ────────────────────── */}
        {activeTab === 'mtn_momo' && (
          <div>
            {selectedPackage || (context === 'subscription') ? (
              <MtnMomoForm
                amount={selectedPackage?.amountXAF || 0}
                amountUSD={selectedPackage?.amountUSD || 0}
                description={context === 'subscription' ? 'POS Subscription' : `Credit recharge ${selectedPackage?.id || ''}`}
                onSuccess={onMtnSuccess || onOrangeMoneySuccess}
                onError={onError}
              />
            ) : (
              <div style={comingSoonStyle}>
                <Wallet size={24} color="#cbd5e1" />
                <span>{billing.selectAmount}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Carte bancaire (CamPay payment link) ──────────── */}
        {activeTab === 'carte_bancaire' && (
          <div>
            {selectedPackage || (context === 'subscription') ? (
              <CardPaymentForm
                amount={selectedPackage?.amountXAF || 0}
                amountUSD={selectedPackage?.amountUSD || 0}
                description={context === 'subscription' ? 'POS Subscription' : `Credit recharge ${selectedPackage?.id || ''}`}
                onSuccess={onCardSuccess || onOrangeMoneySuccess}
                onError={onError}
                organizationId={organizationId}
              />
            ) : (
              <div style={comingSoonStyle}>
                <CreditCard size={24} color="#cbd5e1" />
                <span>{billing.selectAmount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
