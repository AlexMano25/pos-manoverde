// ---------------------------------------------------------------------------
// POS Mano Verde SA -- Receipt Templates Engine
// 4 templates: Classic, Modern, Minimal (thermal), Professional (tax detail)
// ---------------------------------------------------------------------------

import type { Order, Store } from '../types'
import { formatCurrencyPlain } from './currency'

export type ReceiptTemplate = 'classic' | 'modern' | 'minimal' | 'professional'

export type ReceiptTemplateInfo = {
  id: ReceiptTemplate
  name: string
  description: string
}

export const RECEIPT_TEMPLATES: ReceiptTemplateInfo[] = [
  { id: 'classic', name: 'Classic', description: 'Standard receipt with clean layout' },
  { id: 'modern', name: 'Modern', description: 'Colorful receipt with accent colors' },
  { id: 'minimal', name: 'Minimal', description: 'Compact receipt for thermal printers' },
  { id: 'professional', name: 'Professional', description: 'Detailed receipt with tax breakdown' },
]

function fmt(amount: number, currency: string): string {
  return formatCurrencyPlain(amount, currency)
}

// ── Classic Template ──────────────────────────────────────────────────────

function classicTemplate(order: Order, store: Store, cashierName?: string): string {
  const currency = store.currency || 'XAF'
  const orderId = order.receipt_number || order.id.slice(0, 8).toUpperCase()
  const date = new Date(order.created_at).toLocaleString('fr-FR')

  const itemRows = order.items
    .map(it =>
      `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px">${it.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:13px">${it.qty}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px">${fmt(it.price, currency)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:600">${fmt(it.price * it.qty, currency)}</td>
      </tr>`)
    .join('')

  const paymentsInfo = order.payments
    ? order.payments.map(p => `${p.method.toUpperCase()}: ${fmt(p.amount, currency)}`).join(' | ')
    : order.payment_method.toUpperCase()

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
<div style="max-width:400px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1e293b;color:#fff;padding:20px;text-align:center">
    <h2 style="margin:0 0 4px;font-size:18px">${store.name}</h2>
    ${store.address ? `<p style="margin:0;font-size:12px;opacity:0.8">${store.address}</p>` : ''}
    ${store.phone ? `<p style="margin:0;font-size:12px;opacity:0.8">Tel: ${store.phone}</p>` : ''}
  </div>
  <div style="padding:14px 20px;border-bottom:1px solid #e2e8f0">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:14px;font-weight:700;color:#1e293b">Ticket #${orderId}</span>
      <span style="font-size:12px;color:#64748b">${date}</span>
    </div>
    ${cashierName ? `<p style="margin:4px 0 0;font-size:12px;color:#64748b">Cashier: ${cashierName}</p>` : ''}
  </div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:#f1f5f9">
      <th style="padding:8px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Item</th>
      <th style="padding:8px;text-align:center;font-size:11px;color:#64748b">Qty</th>
      <th style="padding:8px;text-align:right;font-size:11px;color:#64748b">Price</th>
      <th style="padding:8px;text-align:right;font-size:11px;color:#64748b">Total</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div style="padding:12px 20px;border-top:2px solid #e2e8f0">
    <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;color:#1e293b">
      <span>TOTAL</span><span>${fmt(order.total, currency)}</span>
    </div>
  </div>
  <div style="padding:10px 20px;background:#f1f5f9;text-align:center">
    <span style="font-size:13px;font-weight:600;color:#1e293b">${paymentsInfo}</span>
  </div>
  <div style="padding:16px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:12px;color:#64748b">Thank you for your business!</p>
    <p style="margin:4px 0 0;font-size:10px;color:#94a3b8">POS Mano Verde</p>
  </div>
</div></body></html>`
}

// ── Modern Template ───────────────────────────────────────────────────────

function modernTemplate(order: Order, store: Store, cashierName?: string): string {
  const currency = store.currency || 'XAF'
  const orderId = order.receipt_number || order.id.slice(0, 8).toUpperCase()
  const date = new Date(order.created_at).toLocaleString('fr-FR')

  const itemRows = order.items
    .map(it =>
      `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #e2e8f0">
        <div>
          <div style="font-size:14px;font-weight:600;color:#1e293b">${it.name}</div>
          <div style="font-size:12px;color:#64748b">${it.qty} × ${fmt(it.price, currency)}</div>
        </div>
        <div style="font-size:14px;font-weight:700;color:#1e293b">${fmt(it.price * it.qty, currency)}</div>
      </div>`)
    .join('')

  const paymentsInfo = order.payments
    ? order.payments.map(p => `${p.method.toUpperCase()}: ${fmt(p.amount, currency)}`).join(' | ')
    : order.payment_method.toUpperCase()

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f0fdf4">
<div style="max-width:400px;margin:20px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:24px;text-align:center">
    <h2 style="margin:0 0 4px;font-size:20px;letter-spacing:0.5px">${store.name}</h2>
    ${store.address ? `<p style="margin:0;font-size:11px;opacity:0.85">${store.address}</p>` : ''}
    ${store.phone ? `<p style="margin:0;font-size:11px;opacity:0.85">Tel: ${store.phone}</p>` : ''}
  </div>
  <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;background:#f0fdf4">
    <div>
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px">Receipt</div>
      <div style="font-size:15px;font-weight:700;color:#1e293b">#${orderId}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#64748b">${date}</div>
      ${cashierName ? `<div style="font-size:11px;color:#64748b">${cashierName}</div>` : ''}
    </div>
  </div>
  <div style="padding:0 20px 16px">${itemRows}</div>
  ${order.discount && order.discount > 0 ? `<div style="padding:0 20px 8px;display:flex;justify-content:space-between"><span style="color:#dc2626;font-size:13px">Discount</span><span style="color:#dc2626;font-weight:600;font-size:13px">-${fmt(order.discount, currency)}</span></div>` : ''}
  ${order.tip_amount && order.tip_amount > 0 ? `<div style="padding:0 20px 8px;display:flex;justify-content:space-between"><span style="color:#e11d48;font-size:13px">Tip</span><span style="color:#e11d48;font-weight:600;font-size:13px">${fmt(order.tip_amount, currency)}</span></div>` : ''}
  <div style="margin:0 20px;padding:16px 0;border-top:2px solid #16a34a;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:16px;font-weight:700;color:#1e293b">TOTAL</span>
    <span style="font-size:22px;font-weight:800;color:#16a34a">${fmt(order.total, currency)}</span>
  </div>
  <div style="padding:12px 20px;background:#f0fdf4;text-align:center">
    <span style="font-size:12px;color:#16a34a;font-weight:600">${paymentsInfo}</span>
  </div>
  <div style="padding:16px;text-align:center">
    <p style="margin:0;font-size:12px;color:#64748b">Merci de votre visite!</p>
    <p style="margin:4px 0 0;font-size:10px;color:#94a3b8">POS Mano Verde</p>
  </div>
</div></body></html>`
}

// ── Minimal Template (Thermal) ────────────────────────────────────────────

function minimalTemplate(order: Order, store: Store, cashierName?: string): string {
  const currency = store.currency || 'XAF'
  const orderId = order.receipt_number || order.id.slice(0, 8).toUpperCase()
  const date = new Date(order.created_at).toLocaleString('fr-FR')

  const itemLines = order.items
    .map(it =>
      `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0">
        <span>${it.qty}x ${it.name}</span>
        <span style="font-weight:600">${fmt(it.price * it.qty, currency)}</span>
      </div>`)
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Courier New',monospace;background:#fff">
<div style="max-width:300px;margin:10px auto;padding:16px">
  <div style="text-align:center;margin-bottom:10px">
    <div style="font-size:16px;font-weight:700">${store.name}</div>
    ${store.address ? `<div style="font-size:10px;color:#666">${store.address}</div>` : ''}
    ${store.phone ? `<div style="font-size:10px;color:#666">${store.phone}</div>` : ''}
  </div>
  <div style="border-top:1px dashed #000;border-bottom:1px dashed #000;padding:4px 0;margin-bottom:8px;font-size:11px">
    <div style="display:flex;justify-content:space-between"><span>#${orderId}</span><span>${date}</span></div>
    ${cashierName ? `<div style="font-size:10px;color:#666">${cashierName}</div>` : ''}
  </div>
  ${itemLines}
  <div style="border-top:1px dashed #000;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-size:16px;font-weight:700">
    <span>TOTAL</span><span>${fmt(order.total, currency)}</span>
  </div>
  <div style="margin-top:6px;font-size:11px;color:#666">${order.payment_method.toUpperCase()}</div>
  <div style="border-top:1px dashed #000;margin-top:8px;padding-top:8px;text-align:center;font-size:10px;color:#666">
    Merci!
  </div>
</div></body></html>`
}

// ── Professional Template (Tax Detail) ────────────────────────────────────

function professionalTemplate(order: Order, store: Store, cashierName?: string): string {
  const currency = store.currency || 'XAF'
  const orderId = order.receipt_number || order.id.slice(0, 8).toUpperCase()
  const date = new Date(order.created_at).toLocaleString('fr-FR')
  const taxRate = store.tax_rate || 0

  const subtotal = order.items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = order.discount || 0
  const afterDiscount = subtotal - discount
  const taxAmount = taxRate > 0 ? Math.round(afterDiscount * taxRate / (100 + taxRate)) : 0
  const netAmount = afterDiscount - taxAmount
  const tip = order.tip_amount || 0

  const itemRows = order.items
    .map(it =>
      `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:13px">${it.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px">${it.qty}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px">${fmt(it.price, currency)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:600">${fmt(it.price * it.qty, currency)}</td>
      </tr>`)
    .join('')

  const paymentsInfo = order.payments
    ? order.payments.map(p => `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>${p.method.toUpperCase()}</span><span>${fmt(p.amount, currency)}</span></div>`).join('')
    : `<div style="font-size:12px">${order.payment_method.toUpperCase()}: ${fmt(order.total, currency)}</div>`

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
<div style="max-width:420px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="padding:20px;border-bottom:2px solid #2563eb">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <h2 style="margin:0;font-size:18px;color:#1e293b">${store.name}</h2>
        ${store.address ? `<p style="margin:2px 0 0;font-size:11px;color:#64748b">${store.address}</p>` : ''}
        ${store.phone ? `<p style="margin:2px 0 0;font-size:11px;color:#64748b">Tel: ${store.phone}</p>` : ''}
        ${store.tax_id ? `<p style="margin:2px 0 0;font-size:11px;color:#64748b">Tax ID: ${store.tax_id}</p>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#2563eb;text-transform:uppercase;font-weight:700;letter-spacing:0.5px">Invoice</div>
        <div style="font-size:15px;font-weight:700;color:#1e293b">#${orderId}</div>
        <div style="font-size:11px;color:#64748b">${date}</div>
        ${cashierName ? `<div style="font-size:11px;color:#64748b">${cashierName}</div>` : ''}
      </div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:#f8fafc">
      <th style="padding:8px 10px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase">Item</th>
      <th style="padding:8px 10px;text-align:center;font-size:11px;color:#64748b">Qty</th>
      <th style="padding:8px 10px;text-align:right;font-size:11px;color:#64748b">Unit</th>
      <th style="padding:8px 10px;text-align:right;font-size:11px;color:#64748b">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div style="padding:16px 20px;border-top:1px solid #e2e8f0">
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
      <span style="color:#64748b">Subtotal</span><span style="font-weight:600">${fmt(subtotal, currency)}</span>
    </div>
    ${discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:#dc2626">Discount</span><span style="color:#dc2626;font-weight:600">-${fmt(discount, currency)}</span></div>` : ''}
    ${taxRate > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:#64748b">Net (HT)</span><span>${fmt(netAmount, currency)}</span></div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:#64748b">Tax (${taxRate}%)</span><span>${fmt(taxAmount, currency)}</span></div>` : ''}
    ${tip > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="color:#e11d48">Tip</span><span style="color:#e11d48;font-weight:600">${fmt(tip, currency)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:2px solid #1e293b;margin-top:8px">
      <span style="font-size:16px;font-weight:700;color:#1e293b">TOTAL TTC</span>
      <span style="font-size:18px;font-weight:800;color:#1e293b">${fmt(order.total, currency)}</span>
    </div>
  </div>
  <div style="padding:12px 20px;background:#f8fafc;border-top:1px solid #e2e8f0">
    <div style="font-size:11px;color:#64748b;text-transform:uppercase;margin-bottom:4px;font-weight:600">Payment Details</div>
    ${paymentsInfo}
  </div>
  <div style="padding:14px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:11px;color:#64748b">Thank you for your business!</p>
    <p style="margin:2px 0 0;font-size:9px;color:#94a3b8">POS Mano Verde — ${store.name}</p>
  </div>
</div></body></html>`
}

// ── Main renderer ─────────────────────────────────────────────────────────

export function renderReceipt(
  template: ReceiptTemplate,
  order: Order,
  store: Store,
  cashierName?: string,
): string {
  switch (template) {
    case 'modern':
      return modernTemplate(order, store, cashierName)
    case 'minimal':
      return minimalTemplate(order, store, cashierName)
    case 'professional':
      return professionalTemplate(order, store, cashierName)
    case 'classic':
    default:
      return classicTemplate(order, store, cashierName)
  }
}
