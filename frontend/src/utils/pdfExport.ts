/**
 * PDF Export utilities using jsPDF + jspdf-autotable
 *
 * Each function generates and downloads a PDF document.
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import JsBarcode from 'jsbarcode'
import type { Product, Order } from '../types'
import { formatCurrencyPlain } from './currency'

// ── Helpers ────────────────────────────────────────────────────────────────

function addHeader(doc: jsPDF, storeName: string, title: string) {
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(storeName, 14, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 14, 28)

  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35)
  doc.setTextColor(0)

  // Line separator
  doc.setDrawColor(200)
  doc.line(14, 38, doc.internal.pageSize.width - 14, 38)
}

function fmtFCFA(amount: number, currency = 'XAF'): string {
  return formatCurrencyPlain(amount, currency)
}

// ── Products Catalog ──────────────────────────────────────────────────────

export function exportProductsCatalog(
  products: Product[],
  storeName: string,
  labels?: { name?: string; category?: string; price?: string; stock?: string; sku?: string }
) {
  const doc = new jsPDF()
  addHeader(doc, storeName, labels?.name ? `${labels.name}` : 'Products Catalog')

  const head = [
    [
      labels?.name || 'Product',
      labels?.category || 'Category',
      labels?.price || 'Price',
      labels?.stock || 'Stock',
      labels?.sku || 'SKU',
    ],
  ]

  const body = products.map((p) => [
    p.name,
    p.category || '-',
    fmtFCFA(p.price),
    String(p.stock),
    p.sku || '-',
  ])

  autoTable(doc, {
    startY: 44,
    head,
    body,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 10 },
  })

  doc.save(`${storeName.replace(/\s+/g, '_')}_products.pdf`)
}

// ── Barcodes Sheet ────────────────────────────────────────────────────────

export function exportBarcodesSheet(
  products: Product[],
  storeName: string,
) {
  const doc = new jsPDF()
  addHeader(doc, storeName, 'Barcodes Sheet')

  const barcodeProducts = products.filter((p) => p.barcode)

  if (barcodeProducts.length === 0) {
    doc.setFontSize(12)
    doc.text('No products with barcodes found.', 14, 50)
    doc.save(`${storeName.replace(/\s+/g, '_')}_barcodes.pdf`)
    return
  }

  const head = [['Product', 'Barcode', 'Price']]
  const body = barcodeProducts.map((p) => [
    p.name,
    p.barcode || '',
    fmtFCFA(p.price),
  ])

  autoTable(doc, {
    startY: 44,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 11 },
    columnStyles: {
      1: { fontStyle: 'bold', font: 'courier' },
    },
  })

  doc.save(`${storeName.replace(/\s+/g, '_')}_barcodes.pdf`)
}

// ── Sales Report ──────────────────────────────────────────────────────────

export function exportSalesReport(
  orders: Order[],
  storeName: string,
  dateRange?: string,
  labels?: { orderId?: string; date?: string; items?: string; total?: string; payment?: string; status?: string }
) {
  const doc = new jsPDF()
  addHeader(doc, storeName, `Sales Report${dateRange ? ` — ${dateRange}` : ''}`)

  // Summary
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const paidOrders = orders.filter((o) => o.status === 'paid')
  const paidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total orders: ${orders.length}`, 14, 48)
  doc.text(`Total revenue: ${fmtFCFA(totalRevenue)}`, 14, 55)
  doc.text(`Paid revenue: ${fmtFCFA(paidRevenue)}`, 14, 62)
  doc.setFont('helvetica', 'normal')

  // Payment breakdown
  const paymentBreakdown: Record<string, number> = {}
  for (const order of orders) {
    paymentBreakdown[order.payment_method] = (paymentBreakdown[order.payment_method] || 0) + order.total
  }

  let y = 72
  doc.setFontSize(10)
  for (const [method, amount] of Object.entries(paymentBreakdown)) {
    doc.text(`  ${method}: ${fmtFCFA(amount)}`, 14, y)
    y += 7
  }

  // Orders table
  const head = [[
    labels?.orderId || 'Order #',
    labels?.date || 'Date',
    labels?.items || 'Items',
    labels?.total || 'Total',
    labels?.payment || 'Payment',
    labels?.status || 'Status',
  ]]

  const body = orders.map((o) => [
    '#' + o.id.slice(0, 8).toUpperCase(),
    new Date(o.created_at).toLocaleDateString('fr-FR') + ' ' + new Date(o.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    String(o.items.length),
    fmtFCFA(o.total),
    o.payment_method,
    o.status,
  ])

  autoTable(doc, {
    startY: y + 6,
    head,
    body,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
  })

  doc.save(`${storeName.replace(/\s+/g, '_')}_sales_report.pdf`)
}

// ── Invoice (Facture) ─────────────────────────────────────────────────────

export function exportInvoice(
  order: Order,
  storeName: string,
  storeAddress?: string,
  storePhone?: string,
  cashierName?: string,
) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(storeName, 14, 20)

  if (storeAddress) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(storeAddress, 14, 27)
  }
  if (storePhone) {
    doc.setFontSize(9)
    doc.text(`Tel: ${storePhone}`, 14, 32)
  }

  // Invoice title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE / INVOICE', doc.internal.pageSize.width - 14, 20, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`N° ${order.id.slice(0, 8).toUpperCase()}`, doc.internal.pageSize.width - 14, 28, { align: 'right' })
  doc.text(`Date: ${new Date(order.created_at).toLocaleString('fr-FR')}`, doc.internal.pageSize.width - 14, 34, { align: 'right' })
  if (cashierName) {
    doc.text(`Cashier: ${cashierName}`, doc.internal.pageSize.width - 14, 40, { align: 'right' })
  }

  doc.setDrawColor(200)
  doc.line(14, 46, doc.internal.pageSize.width - 14, 46)

  // Items table
  const head = [['Item', 'Qty', 'Unit Price', 'Total']]
  const body = order.items.map((item) => [
    item.name,
    String(item.qty),
    fmtFCFA(item.price),
    fmtFCFA(item.price * item.qty),
  ])

  autoTable(doc, {
    startY: 52,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 10 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  })

  // Total section
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL: ${fmtFCFA(order.total)}`, doc.internal.pageSize.width - 14, finalY, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment: ${order.payment_method.toUpperCase()}`, doc.internal.pageSize.width - 14, finalY + 8, { align: 'right' })
  doc.text(`Status: ${order.status.toUpperCase()}`, doc.internal.pageSize.width - 14, finalY + 14, { align: 'right' })

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('Thank you for your business! — POS Mano Verde', doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' })

  doc.save(`invoice_${order.id.slice(0, 8)}.pdf`)
}

// ── Receipt (Ticket de Caisse) ────────────────────────────────────────────

export function exportReceipt(
  order: Order,
  storeName: string,
  storeAddress?: string,
  storePhone?: string,
  cashierName?: string,
) {
  // Narrow format for receipt (80mm ≈ 226pt width)
  const doc = new jsPDF({ unit: 'pt', format: [226, 600] })

  let y = 20
  const centerX = 113

  // Store name
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(storeName, centerX, y, { align: 'center' })
  y += 14

  if (storeAddress) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(storeAddress, centerX, y, { align: 'center' })
    y += 10
  }
  if (storePhone) {
    doc.setFontSize(7)
    doc.text(`Tel: ${storePhone}`, centerX, y, { align: 'center' })
    y += 10
  }

  // Separator
  doc.setFontSize(7)
  doc.text('─'.repeat(40), centerX, y, { align: 'center' })
  y += 10

  // Order info
  doc.setFontSize(8)
  doc.text(`Ticket #${order.id.slice(0, 8).toUpperCase()}`, 10, y)
  y += 10
  doc.text(`Date: ${new Date(order.created_at).toLocaleString('fr-FR')}`, 10, y)
  y += 10
  if (cashierName) {
    doc.text(`Cashier: ${cashierName}`, 10, y)
    y += 10
  }

  doc.text('─'.repeat(40), centerX, y, { align: 'center' })
  y += 10

  // Items
  doc.setFontSize(8)
  for (const item of order.items) {
    doc.text(item.name, 10, y)
    const lineTotal = fmtFCFA(item.price * item.qty)
    doc.text(lineTotal, 216, y, { align: 'right' })
    y += 10
    doc.setFontSize(7)
    doc.text(`  ${item.qty} x ${fmtFCFA(item.price)}`, 10, y)
    y += 10
    doc.setFontSize(8)
  }

  doc.text('─'.repeat(40), centerX, y, { align: 'center' })
  y += 12

  // Total
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', 10, y)
  doc.text(fmtFCFA(order.total), 216, y, { align: 'right' })
  y += 14

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Payment: ${order.payment_method.toUpperCase()}`, 10, y)
  y += 14

  doc.text('─'.repeat(40), centerX, y, { align: 'center' })
  y += 12

  // Footer
  doc.setFontSize(7)
  doc.text('Merci de votre visite!', centerX, y, { align: 'center' })
  y += 8
  doc.text('POS Mano Verde', centerX, y, { align: 'center' })

  doc.save(`receipt_${order.id.slice(0, 8)}.pdf`)
}

// ── Inventory Report ──────────────────────────────────────────────────────

export function exportInventoryReport(
  products: Product[],
  storeName: string,
  labels?: { product?: string; category?: string; stock?: string; minStock?: string; status?: string; price?: string; value?: string }
) {
  const doc = new jsPDF()
  addHeader(doc, storeName, 'Inventory Report')

  // Summary
  const totalProducts = products.length
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
  const lowStock = products.filter((p) => p.stock <= (p.min_stock ?? 5) && p.stock > 0).length
  const outOfStock = products.filter((p) => p.stock <= 0).length

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total products: ${totalProducts}`, 14, 48)
  doc.text(`Inventory value: ${fmtFCFA(totalValue)}`, 14, 55)
  doc.text(`Low stock: ${lowStock}`, 14, 62)
  doc.text(`Out of stock: ${outOfStock}`, 14, 69)
  doc.setFont('helvetica', 'normal')

  const head = [[
    labels?.product || 'Product',
    labels?.category || 'Category',
    labels?.stock || 'Stock',
    labels?.minStock || 'Min Stock',
    labels?.price || 'Price',
    labels?.value || 'Value',
    labels?.status || 'Status',
  ]]

  const body = products.map((p) => {
    const minStock = p.min_stock ?? 5
    let status = 'OK'
    if (p.stock <= 0) status = 'OUT'
    else if (p.stock <= minStock) status = 'LOW'

    return [
      p.name,
      p.category || '-',
      String(p.stock),
      String(minStock),
      fmtFCFA(p.price),
      fmtFCFA(p.price * p.stock),
      status,
    ]
  })

  autoTable(doc, {
    startY: 76,
    head,
    body,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === 'body') {
        const val = data.cell.raw as string
        if (val === 'OUT') {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = 'bold'
        } else if (val === 'LOW') {
          data.cell.styles.textColor = [245, 158, 11]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  doc.save(`${storeName.replace(/\s+/g, '_')}_inventory.pdf`)
}

// ── Quote (Devis) ─────────────────────────────────────────────────────────

export function exportQuote(
  items: Array<{ name: string; qty: number; price: number }>,
  storeName: string,
  storeAddress?: string,
  storePhone?: string,
) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(storeName, 14, 20)

  if (storeAddress) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(storeAddress, 14, 27)
  }
  if (storePhone) {
    doc.text(`Tel: ${storePhone}`, 14, 32)
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS / QUOTE', doc.internal.pageSize.width - 14, 20, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, doc.internal.pageSize.width - 14, 28, { align: 'right' })
  doc.text(`Valid for 30 days`, doc.internal.pageSize.width - 14, 34, { align: 'right' })

  doc.setDrawColor(200)
  doc.line(14, 42, doc.internal.pageSize.width - 14, 42)

  // Items table
  const head = [['Item', 'Qty', 'Unit Price', 'Total']]
  const body = items.map((item) => [
    item.name,
    String(item.qty),
    fmtFCFA(item.price),
    fmtFCFA(item.price * item.qty),
  ])

  autoTable(doc, {
    startY: 48,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 10 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  })

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL: ${fmtFCFA(total)}`, doc.internal.pageSize.width - 14, finalY, { align: 'right' })

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('This quote is valid for 30 days from the date of issue. — POS Mano Verde', doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' })

  doc.save(`quote_${Date.now()}.pdf`)
}

// ── Daily Summary (Bilan du Jour) ─────────────────────────────────────────

export function exportDailySummary(
  orders: Order[],
  products: Product[],
  storeName: string,
) {
  const doc = new jsPDF()
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  addHeader(doc, storeName, `Daily Summary — ${today}`)

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayOrders = orders.filter((o) => o.created_at.slice(0, 10) === todayStr)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const paidOrders = todayOrders.filter((o) => o.status === 'paid')
  const paidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)

  // Payment breakdown
  const paymentBreakdown: Record<string, { count: number; total: number }> = {}
  for (const order of todayOrders) {
    if (!paymentBreakdown[order.payment_method]) {
      paymentBreakdown[order.payment_method] = { count: 0, total: 0 }
    }
    paymentBreakdown[order.payment_method].count++
    paymentBreakdown[order.payment_method].total += order.total
  }

  let y = 48

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 14, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total orders: ${todayOrders.length}`, 14, y); y += 7
  doc.text(`Total revenue: ${fmtFCFA(todayRevenue)}`, 14, y); y += 7
  doc.text(`Paid revenue: ${fmtFCFA(paidRevenue)}`, 14, y); y += 12

  // Payment breakdown table
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Breakdown', 14, y); y += 8
  doc.setFont('helvetica', 'normal')

  for (const [method, data] of Object.entries(paymentBreakdown)) {
    doc.text(`  ${method}: ${data.count} orders — ${fmtFCFA(data.total)}`, 14, y)
    y += 7
  }
  y += 6

  // Low stock alerts
  const lowStockProducts = products.filter((p) => p.stock <= (p.min_stock ?? 5))
  if (lowStockProducts.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text(`Low Stock Alerts (${lowStockProducts.length})`, 14, y)
    y += 8

    const head = [['Product', 'Stock', 'Min Stock']]
    const body = lowStockProducts.map((p) => [
      p.name,
      String(p.stock),
      String(p.min_stock ?? 5),
    ])

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 9 },
    })
  }

  doc.save(`${storeName.replace(/\s+/g, '_')}_daily_${todayStr}.pdf`)
}

// ── Price Labels with Barcodes ─────────────────────────────────────────────

export function exportPriceLabels(
  products: Product[],
  storeName: string,
  options: {
    labelWidth?: number    // mm (default 60)
    labelHeight?: number   // mm (default 40)
    columns?: number       // labels per row (default 3)
    showCategory?: boolean
    showSku?: boolean
    currencyCode?: string
  } = {}
) {
  const {
    labelWidth = 60,
    labelHeight = 40,
    columns = 3,
    showCategory = false,
    showSku = false,
    currencyCode = 'XAF',
  } = options

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const pageHeight = 297
  const marginX = Math.max(5, (pageWidth - columns * labelWidth) / 2)
  const marginY = 8

  let col = 0
  let row = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const y = marginY + row * labelHeight

    // Page break when exceeding page
    if (y + labelHeight > pageHeight - 5) {
      doc.addPage()
      row = 0
      col = 0
    }

    const cx = marginX + col * labelWidth
    const cy = marginY + row * labelHeight

    // Dashed border (cutting guide)
    doc.setDrawColor(180)
    doc.setLineDashPattern([1.5, 1.5], 0)
    doc.rect(cx, cy, labelWidth, labelHeight)
    doc.setLineDashPattern([], 0)

    // Product name (bold, top)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30)
    const nameLines = doc.splitTextToSize(product.name, labelWidth - 8)
    doc.text(nameLines.slice(0, 2), cx + 4, cy + 6)

    // Category (small, optional)
    let infoY = cy + (nameLines.length > 1 ? 12 : 9)
    if (showCategory && product.category) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(product.category, cx + 4, infoY)
      infoY += 3
    }
    if (showSku && product.sku) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(`SKU: ${product.sku}`, cx + 4, infoY)
    }

    // Price (large, prominent, right-aligned)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    const priceStr = formatCurrencyPlain(product.price, currencyCode)
    doc.text(priceStr, cx + labelWidth - 4, cy + 10, { align: 'right' })

    // Barcode (bottom of label)
    if (product.barcode) {
      try {
        const canvas = document.createElement('canvas')
        JsBarcode(canvas, product.barcode, {
          format: 'CODE128',
          width: 1.5,
          height: 28,
          displayValue: true,
          fontSize: 9,
          margin: 0,
          textMargin: 1,
        })
        const barcodeDataUrl = canvas.toDataURL('image/png')
        const barcodeW = Math.min(labelWidth - 8, 52)
        const barcodeH = 14
        const barcodeX = cx + (labelWidth - barcodeW) / 2
        const barcodeY = cy + labelHeight - barcodeH - 3
        doc.addImage(barcodeDataUrl, 'PNG', barcodeX, barcodeY, barcodeW, barcodeH)
      } catch (err) {
        // Barcode generation failed, skip
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(product.barcode, cx + labelWidth / 2, cy + labelHeight - 5, { align: 'center' })
      }
    }

    // Advance grid
    col++
    if (col >= columns) {
      col = 0
      row++
    }
  }

  doc.save(`${storeName.replace(/\s+/g, '_')}_labels.pdf`)
}
