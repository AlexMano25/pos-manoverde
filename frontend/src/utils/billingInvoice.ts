import { supabase } from '../services/supabase'
import { formatCurrency } from './currency'

// ---------------------------------------------------------------------------
// Billing Invoice — generates HTML invoice and sends via send-email edge fn
// Triggered after successful subscription or credit recharge payment
// Sender: sale@manovende.com
// ---------------------------------------------------------------------------

interface InvoiceData {
  // Customer info
  customerName: string
  customerEmail: string
  organizationName?: string

  // Payment details
  type: 'subscription' | 'recharge'
  planName?: string              // for subscriptions
  billingCycle?: string          // monthly / yearly
  packageName?: string           // for recharges (micro, standard, pro, business)
  tickets?: number               // for recharges

  // Amounts
  amountXAF: number
  amountUSD?: number

  // Transaction reference
  transactionId: string
  paymentMethod: string          // Orange Money, MTN MoMo, Carte bancaire, PayPal
}

const INVOICE_FROM = 'sale@manovende.com'

/**
 * Generate a unique invoice number: INV-YYYYMMDD-XXXXX
 */
function generateInvoiceNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `INV-${date}-${rand}`
}

/**
 * Format date for invoice display
 */
function formatInvoiceDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Build the HTML invoice email
 */
function buildInvoiceHTML(data: InvoiceData, invoiceNumber: string): string {
  const now = new Date()
  const dateStr = formatInvoiceDate(now)

  const description = data.type === 'subscription'
    ? `Abonnement ${data.planName || ''} — ${data.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}`
    : `Recharge credits — Pack ${data.packageName || ''}${data.tickets ? ` (${data.tickets.toLocaleString()} tickets)` : ''}`

  const amountDisplay = formatCurrency(data.amountXAF, 'XAF')
  const usdDisplay = data.amountUSD ? `~$${data.amountUSD.toFixed(2)} USD` : ''

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 24px;border-radius:12px 12px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:26px;letter-spacing:0.5px">POS Mano Verde</h1>
      <p style="color:#93c5fd;margin:8px 0 0;font-size:14px">Facture de paiement</p>
    </div>

    <!-- Invoice body -->
    <div style="background:#ffffff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none">

      <!-- Invoice meta -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b">N° Facture</td>
          <td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:700;text-align:right">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b">Date</td>
          <td style="padding:4px 0;font-size:13px;color:#1e293b;text-align:right">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b">Reference</td>
          <td style="padding:4px 0;font-size:13px;color:#1e293b;text-align:right;word-break:break-all">${data.transactionId}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#64748b">Methode</td>
          <td style="padding:4px 0;font-size:13px;color:#1e293b;text-align:right">${data.paymentMethod}</td>
        </tr>
      </table>

      <!-- Customer -->
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Client</p>
        <p style="margin:0;font-size:14px;color:#1e293b;font-weight:600">${data.customerName}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#475569">${data.customerEmail}</p>
        ${data.organizationName ? `<p style="margin:2px 0 0;font-size:13px;color:#475569">${data.organizationName}</p>` : ''}
      </div>

      <!-- Line items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0">
            <th style="padding:10px 0;font-size:12px;color:#64748b;text-align:left;text-transform:uppercase;letter-spacing:0.05em">Description</th>
            <th style="padding:10px 0;font-size:12px;color:#64748b;text-align:right;text-transform:uppercase;letter-spacing:0.05em">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:14px 0;font-size:14px;color:#1e293b">${description}</td>
            <td style="padding:14px 0;font-size:14px;color:#1e293b;text-align:right;font-weight:600">${amountDisplay}</td>
          </tr>
        </tbody>
      </table>

      <!-- Total -->
      <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:10px;padding:20px;text-align:center;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:12px;color:#1e40af;text-transform:uppercase;letter-spacing:0.05em">Total paye</p>
        <p style="margin:0;font-size:28px;color:#1e40af;font-weight:800">${amountDisplay}</p>
        ${usdDisplay ? `<p style="margin:4px 0 0;font-size:13px;color:#3b82f6">${usdDisplay}</p>` : ''}
      </div>

      <!-- Status badge -->
      <div style="text-align:center;margin-bottom:24px">
        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;padding:6px 20px;border-radius:20px;font-size:13px;font-weight:600;border:1px solid #bbf7d0">
          &#10003; Paiement confirme
        </span>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:16px">
        <a href="https://pos.manovende.com" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Acceder a votre compte
        </a>
      </div>

      <!-- Legal note -->
      <p style="font-size:11px;color:#94a3b8;line-height:1.5;margin:16px 0 0;text-align:center">
        Cette facture est generee automatiquement par POS Mano Verde.<br>
        Pour toute question, contactez-nous a sale@manovende.com
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 24px;text-align:center;border-radius:0 0 12px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none">
      <p style="margin:0;font-size:12px;color:#94a3b8">
        TERRASOCIAL SAS — POS Mano Verde<br>
        Douala, Cameroun
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1">
        &copy; ${now.getFullYear()} Mano Verde. Tous droits reserves.
      </p>
    </div>

  </div>
</body>
</html>`
}

/**
 * Send billing invoice email after successful payment.
 * Non-blocking — errors are logged but don't break the payment flow.
 */
export async function sendBillingInvoice(data: InvoiceData): Promise<void> {
  try {
    if (!supabase) {
      console.warn('[BillingInvoice] Supabase not configured, skipping invoice email')
      return
    }

    const invoiceNumber = generateInvoiceNumber()
    const html = buildInvoiceHTML(data, invoiceNumber)

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vnxrspaeptbspoxpzxbn.supabase.co'
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Get auth token if available
    let token = ''
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      token = sessionData?.session?.access_token || ''
    } catch { /* proceed without token */ }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (anonKey) headers['apikey'] = anonKey

    const typeLabel = data.type === 'subscription' ? 'Abonnement' : 'Recharge credits'
    const subject = `Facture ${invoiceNumber} — ${typeLabel} POS Mano Verde`

    const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: data.customerEmail,
        from: INVOICE_FROM,
        subject,
        html,
      }),
    })

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}))
      console.error('[BillingInvoice] Failed to send invoice:', errData)
    } else {
      console.log(`[BillingInvoice] Invoice ${invoiceNumber} sent to ${data.customerEmail}`)
    }
  } catch (err) {
    console.error('[BillingInvoice] Error sending invoice email:', err)
  }
}
