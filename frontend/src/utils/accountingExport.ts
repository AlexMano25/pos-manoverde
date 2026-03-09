// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Accounting Export Engine
// Journal Entries, QuickBooks CSV, SAGE CSV
// ---------------------------------------------------------------------------

import type { Order, Store } from '../types'

// ── Journal Entry ─────────────────────────────────────────────────────────

export type JournalEntry = {
  date: string         // YYYY-MM-DD
  reference: string    // receipt / order number
  account: string      // account code
  accountName: string  // account name
  debit: number
  credit: number
  description: string
}

export function generateJournalEntries(
  orders: Order[],
  store: Store,
): JournalEntry[] {
  const entries: JournalEntry[] = []
  const taxRate = store.tax_rate || 0

  for (const order of orders) {
    if (order.status !== 'paid') continue

    const date = order.created_at.slice(0, 10)
    const ref = order.receipt_number || order.id.slice(0, 8).toUpperCase()
    const total = order.total
    const tip = order.tip_amount || 0
    const discount = order.discount || 0
    const salesAmount = total - tip

    // Tax computation (tax-inclusive)
    const taxAmount = taxRate > 0
      ? Math.round(salesAmount * taxRate / (100 + taxRate))
      : 0
    const netSales = salesAmount - taxAmount

    // Debit: Cash / Bank / Mobile Money
    const paymentAccount = getPaymentAccount(order.payment_method)
    entries.push({
      date,
      reference: ref,
      account: paymentAccount.code,
      accountName: paymentAccount.name,
      debit: total,
      credit: 0,
      description: `Sale #${ref}`,
    })

    // Credit: Sales Revenue
    entries.push({
      date,
      reference: ref,
      account: '7010',
      accountName: 'Sales Revenue',
      debit: 0,
      credit: netSales,
      description: `Sale #${ref} - Revenue`,
    })

    // Credit: Tax Collected (if applicable)
    if (taxAmount > 0) {
      entries.push({
        date,
        reference: ref,
        account: '4457',
        accountName: 'Tax Collected (TVA)',
        debit: 0,
        credit: taxAmount,
        description: `Sale #${ref} - Tax`,
      })
    }

    // Credit: Tips (if applicable)
    if (tip > 0) {
      entries.push({
        date,
        reference: ref,
        account: '4280',
        accountName: 'Tips Payable',
        debit: 0,
        credit: tip,
        description: `Sale #${ref} - Tip`,
      })
    }

    // Debit: Discount (if applicable)
    if (discount > 0) {
      entries.push({
        date,
        reference: ref,
        account: '7090',
        accountName: 'Sales Discounts',
        debit: discount,
        credit: 0,
        description: `Sale #${ref} - Discount`,
      })
    }
  }

  return entries
}

function getPaymentAccount(method: string): { code: string; name: string } {
  switch (method) {
    case 'cash':
      return { code: '5710', name: 'Cash' }
    case 'card':
    case 'carte_bancaire':
      return { code: '5120', name: 'Bank Card' }
    case 'momo':
    case 'mtn_money':
      return { code: '5130', name: 'MTN Mobile Money' }
    case 'orange_money':
      return { code: '5131', name: 'Orange Money' }
    case 'transfer':
      return { code: '5140', name: 'Bank Transfer' }
    case 'paypal':
      return { code: '5150', name: 'PayPal' }
    default:
      return { code: '5100', name: 'Other Payment' }
  }
}

// ── CSV Export (Generic Journal) ──────────────────────────────────────────

export function exportJournalCSV(entries: JournalEntry[], storeName: string): void {
  const bom = '\uFEFF'
  const headers = ['Date', 'Reference', 'Account Code', 'Account Name', 'Debit', 'Credit', 'Description']
  const rows = entries.map(e => [
    e.date,
    e.reference,
    e.account,
    e.accountName,
    e.debit > 0 ? e.debit.toFixed(2) : '',
    e.credit > 0 ? e.credit.toFixed(2) : '',
    `"${e.description}"`,
  ])

  const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadCSV(csv, `${storeName.replace(/\s+/g, '_')}_journal.csv`)
}

// ── QuickBooks IIF Export ────────────────────────────────────────────────

export function exportQuickBooksCSV(entries: JournalEntry[], storeName: string): void {
  const bom = '\uFEFF'
  const headers = ['Date', 'Transaction Type', 'Num', 'Name', 'Account', 'Debit', 'Credit', 'Memo']
  const rows = entries.map(e => [
    e.date,
    'GENERAL JOURNAL',
    e.reference,
    '',
    `${e.account} - ${e.accountName}`,
    e.debit > 0 ? e.debit.toFixed(2) : '',
    e.credit > 0 ? e.credit.toFixed(2) : '',
    `"${e.description}"`,
  ])

  const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadCSV(csv, `${storeName.replace(/\s+/g, '_')}_quickbooks.csv`)
}

// ── SAGE Export ──────────────────────────────────────────────────────────

export function exportSAGECSV(entries: JournalEntry[], storeName: string): void {
  const bom = '\uFEFF'
  // SAGE format: Journal;Date;Pièce;Compte;Libellé;Débit;Crédit
  const headers = ['Journal', 'Date', 'Piece', 'Compte', 'Libelle', 'Debit', 'Credit']
  const rows = entries.map(e => [
    'VE', // Journal code: Ventes
    e.date.replace(/-/g, ''),
    e.reference,
    e.account,
    `"${e.description}"`,
    e.debit > 0 ? e.debit.toFixed(2) : '0.00',
    e.credit > 0 ? e.credit.toFixed(2) : '0.00',
  ])

  const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
  downloadCSV(csv, `${storeName.replace(/\s+/g, '_')}_sage.csv`)
}

// ── Summary Report ──────────────────────────────────────────────────────

export type AccountingSummary = {
  totalRevenue: number
  totalTax: number
  totalDiscounts: number
  totalTips: number
  netRevenue: number
  paymentBreakdown: { method: string; amount: number }[]
  periodStart: string
  periodEnd: string
  orderCount: number
}

export function computeAccountingSummary(
  orders: Order[],
  store: Store,
): AccountingSummary {
  const paidOrders = orders.filter(o => o.status === 'paid')
  const taxRate = store.tax_rate || 0

  let totalRevenue = 0
  let totalTax = 0
  let totalDiscounts = 0
  let totalTips = 0
  const paymentMap = new Map<string, number>()

  for (const order of paidOrders) {
    const total = order.total
    const tip = order.tip_amount || 0
    const salesAmount = total - tip
    const taxAmount = taxRate > 0 ? Math.round(salesAmount * taxRate / (100 + taxRate)) : 0

    totalRevenue += total
    totalTax += taxAmount
    totalDiscounts += order.discount || 0
    totalTips += tip

    const method = order.payment_method
    paymentMap.set(method, (paymentMap.get(method) || 0) + total)
  }

  const dates = paidOrders.map(o => o.created_at.slice(0, 10)).sort()

  return {
    totalRevenue,
    totalTax,
    totalDiscounts,
    totalTips,
    netRevenue: totalRevenue - totalTax - totalTips,
    paymentBreakdown: Array.from(paymentMap.entries())
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount),
    periodStart: dates[0] || '',
    periodEnd: dates[dates.length - 1] || '',
    orderCount: paidOrders.length,
  }
}

// ── Helper ──────────────────────────────────────────────────────────────

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
