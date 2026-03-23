// ── Plan Warning Banner ──────────────────────────────────────────────────────
// Displays a dismissible warning when plan is nearing expiration or expired.
// Includes a license code modal for offline renewal.

import { useState } from 'react'
import { AlertTriangle, X, KeyRound, CreditCard } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { validateLicenseCode, getLicenseEndDate } from '../utils/licenseManager'
import { supabase } from '../services/supabase'
import { db } from '../db/dexie'
import type { PlanStatusLevel } from '../types'

const C = {
  warning30Bg: '#FEF3C7',
  warning30Border: '#F59E0B',
  warning30Text: '#92400E',
  warning10Bg: '#FEE2E2',
  warning10Border: '#EF4444',
  warning10Text: '#991B1B',
  expiredBg: '#7F1D1D',
  expiredBorder: '#DC2626',
  expiredText: '#FFFFFF',
  graceBg: '#FED7AA',
  graceBorder: '#EA580C',
  graceText: '#9A3412',
  btn: '#2563EB',
  btnHover: '#1D4ED8',
  modalBg: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
  gray100: '#F3F4F6',
  gray600: '#4B5563',
  gray800: '#1F2937',
  green600: '#059669',
  red600: '#DC2626',
}

function getStylesForLevel(level: PlanStatusLevel) {
  switch (level) {
    case 'warning_30': return { bg: C.warning30Bg, border: C.warning30Border, text: C.warning30Text }
    case 'warning_10': return { bg: C.warning10Bg, border: C.warning10Border, text: C.warning10Text }
    case 'expired': return { bg: C.expiredBg, border: C.expiredBorder, text: C.expiredText }
    case 'grace': return { bg: C.graceBg, border: C.graceBorder, text: C.graceText }
    default: return { bg: 'transparent', border: 'transparent', text: 'inherit' }
  }
}

export default function PlanWarningBanner() {
  const planStatus = useAppStore(s => s.planStatus)
  const dismissed = useAppStore(s => s.planWarningDismissed)
  const setDismissed = useAppStore(s => s.setPlanWarningDismissed)
  const setPlanStatus = useAppStore(s => s.setPlanStatus)
  const setSection = useAppStore(s => s.setSection)
  const currentStore = useAppStore(s => s.currentStore)
  const user = useAuthStore(s => s.user)
  const t = useLanguageStore(s => s.t)

  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenseCode, setLicenseCode] = useState('')
  const [licenseError, setLicenseError] = useState('')
  const [licenseSuccess, setLicenseSuccess] = useState(false)
  const [validating, setValidating] = useState(false)

  if (!planStatus || planStatus.level === 'active' || !user || user.role === 'super_admin') return null
  if (dismissed && planStatus.level === 'warning_30') return null

  const level = planStatus.level
  const styles = getStylesForLevel(level)
  const isDays = planStatus.daysRemaining != null
  const isCredits = planStatus.creditsPct != null

  let message = ''
  if (level === 'warning_30') {
    message = isDays
      ? (t as any)?.planEnforcement?.warning30Days?.replace('{days}', String(planStatus.daysRemaining)) || `Your plan expires in ${planStatus.daysRemaining} days`
      : (t as any)?.planEnforcement?.warning30Credits?.replace('{pct}', String(Math.round(planStatus.creditsPct || 0))) || `${Math.round(planStatus.creditsPct || 0)}% credits remaining`
  } else if (level === 'warning_10') {
    message = isDays
      ? (t as any)?.planEnforcement?.warning10Days?.replace('{days}', String(planStatus.daysRemaining)) || `URGENT: ${planStatus.daysRemaining} days remaining`
      : (t as any)?.planEnforcement?.warning10Credits?.replace('{pct}', String(Math.round(planStatus.creditsPct || 0))) || `URGENT: ${Math.round(planStatus.creditsPct || 0)}% credits remaining`
  } else if (level === 'grace') {
    message = (t as any)?.planEnforcement?.graceMessage || 'Plan expired — grace period active. Renew now to avoid service interruption.'
  } else if (level === 'expired') {
    message = isCredits
      ? ((t as any)?.planEnforcement?.expiredCredits || 'Credits depleted. Recharge to continue using the POS.')
      : ((t as any)?.planEnforcement?.expiredPlan || 'Plan expired. Renew to continue using the POS.')
  }

  const handleRenew = () => setSection('billing')

  const handleValidateLicense = async () => {
    if (!licenseCode.trim() || !currentStore?.organization_id) return
    setValidating(true)
    setLicenseError('')
    setLicenseSuccess(false)

    try {
      const result = await validateLicenseCode(licenseCode.trim(), currentStore.organization_id)
      if (!result.valid) {
        setLicenseError(result.error || 'Invalid code')
        setValidating(false)
        return
      }

      // Apply the license: update cached subscription in IndexedDB
      const endDate = getLicenseEndDate(result.parsed!)
      try {
        const cached = await db.table('_meta').get('subscription')
        if (cached?.value) {
          const updated = {
            ...cached.value,
            plan: result.parsed!.plan,
            status: 'active',
            current_period_end: endDate.toISOString(),
          }
          await db.table('_meta').put({ key: 'subscription', value: updated })
        }
      } catch { /* ignore */ }

      // Mark license as used in Supabase (prevent reuse)
      if (supabase) {
        supabase.from('license_codes')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('code', licenseCode.trim().toUpperCase())
          .then(({ error: e }) => { if (e) console.warn('[license] Mark used failed:', e.message) })
      }

      // Also update subscription in Supabase if online
      if (supabase && currentStore?.organization_id) {
        supabase.from('subscriptions')
          .upsert({
            organization_id: currentStore.organization_id,
            plan: result.parsed!.plan,
            status: 'active',
            current_period_end: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          } as never)
          .then(({ error: e }) => { if (e) console.warn('[license] Sub update failed:', e.message) })
      }

      // Update plan status immediately
      setPlanStatus({
        level: 'active',
        daysRemaining: result.parsed!.days,
        creditsRemaining: null,
        creditsPct: null,
        checkedAt: new Date().toISOString(),
        licenseApplied: licenseCode.trim(),
      })

      setLicenseSuccess(true)
      setTimeout(() => {
        setShowLicenseModal(false)
        setLicenseCode('')
        setLicenseSuccess(false)
      }, 2000)
    } catch {
      setLicenseError('Validation failed')
    }
    setValidating(false)
  }

  const canDismiss = level === 'warning_30'

  return (
    <>
      {/* Banner */}
      <div style={{
        background: styles.bg,
        borderBottom: `2px solid ${styles.border}`,
        color: styles.text,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 1000,
      }}>
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{message}</span>
        <button onClick={handleRenew} style={{
          background: level === 'expired' ? C.white : C.btn,
          color: level === 'expired' ? C.expiredBg : C.white,
          border: 'none',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <CreditCard size={14} />
          {(t as any)?.planEnforcement?.renewBtn || 'Renew'}
        </button>
        <button onClick={() => setShowLicenseModal(true)} style={{
          background: 'transparent',
          color: styles.text,
          border: `1px solid ${styles.text}`,
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <KeyRound size={14} />
          {(t as any)?.planEnforcement?.licenseBtn || 'License Code'}
        </button>
        {canDismiss && (
          <button onClick={() => setDismissed(true)} style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: styles.text,
            padding: 4,
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* License Code Modal */}
      {showLicenseModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: C.modalBg,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }} onClick={() => setShowLicenseModal(false)}>
          <div style={{
            background: C.white,
            borderRadius: 12,
            padding: 24,
            width: 400,
            maxWidth: '90vw',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: C.gray800 }}>
              {(t as any)?.planEnforcement?.licenseTitle || 'Enter License Code'}
            </h3>
            <p style={{ margin: '0 0 16px', color: C.gray600, fontSize: 14 }}>
              {(t as any)?.planEnforcement?.licenseDesc || 'Enter the license code provided by your administrator to renew your plan offline.'}
            </p>
            <input
              type="text"
              value={licenseCode}
              onChange={e => { setLicenseCode(e.target.value.toUpperCase()); setLicenseError('') }}
              placeholder="MV-XXXXXXXX-XXXXXX-X-XX-XXXXXXXX"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${licenseError ? C.red600 : '#D1D5DB'}`,
                borderRadius: 8,
                fontSize: 15,
                fontFamily: 'monospace',
                letterSpacing: 1,
                boxSizing: 'border-box',
              }}
            />
            {licenseError && (
              <p style={{ color: C.red600, fontSize: 13, margin: '8px 0 0' }}>{licenseError}</p>
            )}
            {licenseSuccess && (
              <p style={{ color: C.green600, fontSize: 13, margin: '8px 0 0', fontWeight: 600 }}>
                {(t as any)?.planEnforcement?.licenseSuccess || 'License applied successfully!'}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLicenseModal(false)} style={{
                padding: '8px 16px',
                border: `1px solid #D1D5DB`,
                borderRadius: 8,
                background: C.white,
                cursor: 'pointer',
                fontSize: 14,
              }}>
                {(t as any)?.common?.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleValidateLicense}
                disabled={!licenseCode.trim() || validating}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 8,
                  background: C.btn,
                  color: C.white,
                  cursor: licenseCode.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 600,
                  opacity: licenseCode.trim() ? 1 : 0.5,
                }}
              >
                {validating ? ((t as any)?.common?.loading || 'Validating...') : ((t as any)?.planEnforcement?.validateBtn || 'Validate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
