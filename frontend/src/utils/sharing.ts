/**
 * Sharing utilities: WhatsApp, email, and Web Share API
 */

/**
 * Share text via WhatsApp (opens wa.me link)
 */
export function shareViaWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text)
  window.open(`https://wa.me/?text=${encoded}`, '_blank')
}

/**
 * Share via email (opens mailto link)
 */
export function shareViaEmail(subject: string, body: string): void {
  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)
  window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`, '_self')
}

/**
 * Share a PDF blob using Web Share API if available, fallback to download
 */
export async function sharePDF(blob: Blob, filename: string): Promise<void> {
  // Try Web Share API (available on mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: 'application/pdf' })
    const shareData = { files: [file], title: filename }

    if (navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        // User cancelled or share failed, fall back to download
        if ((err as Error).name === 'AbortError') return
      }
    }
  }

  // Fallback: download the file
  downloadBlob(blob, filename)
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Format an order summary as text for sharing
 */
export function formatOrderForSharing(
  order: {
    id: string
    total: number
    payment_method: string
    status: string
    items: Array<{ name: string; qty: number; price: number }>
    created_at: string
  },
  storeName: string,
): string {
  const lines: string[] = [
    `📋 ${storeName}`,
    `Order #${order.id.slice(0, 8).toUpperCase()}`,
    `Date: ${new Date(order.created_at).toLocaleString()}`,
    '',
    '─── Items ───',
  ]

  for (const item of order.items) {
    lines.push(`• ${item.name} x${item.qty} — ${(item.price * item.qty).toLocaleString()} FCFA`)
  }

  lines.push('')
  lines.push(`💰 Total: ${order.total.toLocaleString()} FCFA`)
  lines.push(`💳 Payment: ${order.payment_method}`)
  lines.push(`📌 Status: ${order.status}`)

  return lines.join('\n')
}
