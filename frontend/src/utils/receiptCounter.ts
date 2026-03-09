// ---------------------------------------------------------------------------
// receiptCounter — Sequential receipt number generator
// Format: {prefix}-{YYYYMMDD}-{seq} (e.g., MV-20260309-0042)
// Uses localStorage for persistence across sessions.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pos_receipt_counter'

type CounterData = {
  date: string   // YYYYMMDD
  seq: number    // current sequence for that day
}

function getCounterKey(storeId: string): string {
  return `${STORAGE_KEY}_${storeId}`
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Get and increment the receipt counter for a store.
 * Returns a formatted receipt number like "MV-20260309-0042"
 */
export function getNextReceiptNumber(storeId: string, prefix?: string): string {
  const key = getCounterKey(storeId)
  const todayStr = getTodayStr()
  const pfx = prefix || 'MV'

  let data: CounterData
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      data = JSON.parse(stored)
      // Reset counter if new day
      if (data.date !== todayStr) {
        data = { date: todayStr, seq: 0 }
      }
    } else {
      data = { date: todayStr, seq: 0 }
    }
  } catch {
    data = { date: todayStr, seq: 0 }
  }

  // Increment
  data.seq += 1

  // Save
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // localStorage full — continue anyway
  }

  return `${pfx}-${todayStr}-${String(data.seq).padStart(4, '0')}`
}

/**
 * Reset the counter for a store (admin action)
 */
export function resetReceiptCounter(storeId: string): void {
  const key = getCounterKey(storeId)
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/**
 * Get current counter state for display
 */
export function getReceiptCounterState(storeId: string): { date: string; seq: number } | null {
  const key = getCounterKey(storeId)
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return null
}
