/**
 * Generate a UUID v4 string.
 * Uses native crypto.randomUUID() when available (modern browsers),
 * falls back to Math.random()-based generation for older browsers (Android 7+, old iOS).
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for older browsers (Android 7 / Chrome 59 / iOS 10)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
