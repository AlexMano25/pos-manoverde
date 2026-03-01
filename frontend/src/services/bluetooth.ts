// ---------------------------------------------------------------------------
// Bluetooth Printing Service -- Web Bluetooth API + ESC/POS encoding
// ---------------------------------------------------------------------------

import type { Order, PrinterStatus } from '../types'

// ── ESC/POS Command Constants ───────────────────────────────────────────────

const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

// Common Bluetooth service UUIDs for thermal receipt printers
const PRINTER_SERVICE_UUIDS: BluetoothServiceUUID[] = [
  0x18f0, // generic serial / printer service
  0xff00, // custom vendor service (very common on Chinese printers)
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip ISSC serial
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // RD / Rongta / Goojprt
]

// Writable characteristic UUIDs (commonly used by BLE printers)
const WRITABLE_CHARACTERISTIC_UUIDS: BluetoothCharacteristicUUID[] = [
  0xff02,
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // Microchip ISSC write
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Generic writable
]

// Max bytes per BLE write operation (safe limit for most devices)
const BLE_CHUNK_SIZE = 512

// French-friendly code page: CP858 (Western European with euro sign)
// Maps characters 128-255 for CP437/CP858 compatibility
const FRENCH_CHAR_MAP: Record<string, number> = {
  '\u00e0': 0x85, // a
  '\u00e2': 0x83, // a (circumflex)
  '\u00e4': 0x84, // a (diaeresis)
  '\u00e7': 0x87, // c (cedilla)
  '\u00e8': 0x8a, // e (grave)
  '\u00e9': 0x82, // e (acute)
  '\u00ea': 0x88, // e (circumflex)
  '\u00eb': 0x89, // e (diaeresis)
  '\u00ee': 0x8c, // i (circumflex)
  '\u00ef': 0x8b, // i (diaeresis)
  '\u00f4': 0x93, // o (circumflex)
  '\u00f6': 0x94, // o (diaeresis)
  '\u00f9': 0x97, // u (grave)
  '\u00fb': 0x96, // u (circumflex)
  '\u00fc': 0x81, // u (diaeresis)
  '\u00c0': 0xb7, // A (grave)
  '\u00c2': 0xb6, // A (circumflex) -- approx
  '\u00c7': 0x80, // C (cedilla)
  '\u00c8': 0xd4, // E (grave) -- approx
  '\u00c9': 0x90, // E (acute)
  '\u00ca': 0xd2, // E (circumflex) -- approx
  '\u00cb': 0xd3, // E (diaeresis) -- approx
  '\u00ce': 0xd8, // I (circumflex) -- approx
  '\u00d4': 0xe2, // O (circumflex) -- approx
  '\u00d9': 0xeb, // U (grave) -- approx
  '\u00db': 0xea, // U (circumflex) -- approx
  '\u20ac': 0xd5, // Euro sign (CP858)
}

// Receipt paper width in characters (58mm paper = ~32 chars, 80mm = ~48)
const RECEIPT_WIDTH = 32

// ── ESC/POS Encoder ─────────────────────────────────────────────────────────

export class ESCPOSEncoder {
  /**
   * Initialize printer (ESC @)
   */
  static initialize(): Uint8Array {
    return new Uint8Array([ESC, 0x40])
  }

  /**
   * Set text alignment
   * ESC a n -- 0=left, 1=center, 2=right
   */
  static setAlign(align: 'left' | 'center' | 'right'): Uint8Array {
    const n = align === 'left' ? 0 : align === 'center' ? 1 : 2
    return new Uint8Array([ESC, 0x61, n])
  }

  /**
   * Set bold mode
   * ESC E n -- 0=off, 1=on
   */
  static setBold(on: boolean): Uint8Array {
    return new Uint8Array([ESC, 0x45, on ? 1 : 0])
  }

  /**
   * Set font size
   * GS ! n
   * Bit 0-3: character width multiplier (0=1x, 1=2x, ...)
   * Bit 4-7: character height multiplier (0=1x, 1=2x, ...)
   */
  static setFontSize(
    size: 'normal' | 'double-width' | 'double-height' | 'double',
  ): Uint8Array {
    let n: number
    switch (size) {
      case 'normal':
        n = 0x00
        break
      case 'double-width':
        n = 0x10
        break
      case 'double-height':
        n = 0x01
        break
      case 'double':
        n = 0x11
        break
    }
    return new Uint8Array([GS, 0x21, n])
  }

  /**
   * Encode text string to bytes, handling French accented characters
   * via CP437/CP858 code page mapping
   */
  static text(str: string): Uint8Array {
    const bytes: number[] = []
    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      const mapped = FRENCH_CHAR_MAP[char]
      if (mapped !== undefined) {
        bytes.push(mapped)
      } else {
        const code = str.charCodeAt(i)
        // Only include printable ASCII + basic control chars
        bytes.push(code <= 0xff ? code : 0x3f) // '?' for unknown
      }
    }
    return new Uint8Array(bytes)
  }

  /**
   * Line feed
   */
  static newline(): Uint8Array {
    return new Uint8Array([LF])
  }

  /**
   * Print a separator line across the receipt width
   */
  static separator(char = '-'): Uint8Array {
    const line = char.repeat(RECEIPT_WIDTH)
    return ESCPOSEncoder.concat([
      ESCPOSEncoder.text(line),
      ESCPOSEncoder.newline(),
    ])
  }

  /**
   * Paper cut -- partial cut with feed
   * GS V 66 3
   */
  static cut(): Uint8Array {
    return new Uint8Array([GS, 0x56, 66, 3])
  }

  /**
   * Open cash drawer
   * ESC p 0 25 250
   * Pin 2, on-time 25*2ms=50ms, off-time 250*2ms=500ms
   */
  static openCashDrawer(): Uint8Array {
    return new Uint8Array([ESC, 0x70, 0, 25, 250])
  }

  /**
   * Feed n lines
   * ESC d n
   */
  static feedLines(n: number): Uint8Array {
    return new Uint8Array([ESC, 0x64, n])
  }

  /**
   * Select code page for French characters
   * ESC t n -- selects character code table
   * 2 = PC858 (multilingual with euro sign)
   */
  static selectCodePage858(): Uint8Array {
    return new Uint8Array([ESC, 0x74, 2])
  }

  /**
   * Concatenate multiple Uint8Arrays into one
   */
  static concat(arrays: Uint8Array[]): Uint8Array {
    let totalLength = 0
    for (const arr of arrays) {
      totalLength += arr.length
    }
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
      result.set(arr, offset)
      offset += arr.length
    }
    return result
  }
}

// ── Receipt Builder ─────────────────────────────────────────────────────────

/**
 * Format a number as FCFA currency string: "1 234 567 FCFA"
 */
function formatFCFA(amount: number): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} FCFA`
}

/**
 * Pad/align text in two columns: left-aligned label, right-aligned value
 */
function twoColumns(left: string, right: string, width = RECEIPT_WIDTH): string {
  const gap = width - left.length - right.length
  if (gap <= 0) {
    // Truncate the left side if needed
    const truncated = left.slice(0, width - right.length - 1)
    return truncated + ' ' + right
  }
  return left + ' '.repeat(gap) + right
}

/**
 * Format a date string for the receipt
 */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Map payment method code to a display label
 */
function paymentLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Especes',
    card: 'Carte',
    momo: 'Mobile Money',
    transfer: 'Virement',
  }
  return labels[method] ?? method
}

/**
 * Build complete ESC/POS receipt bytes for an order
 */
export function buildReceipt(
  order: Order,
  store: { name: string; address: string; phone: string },
): Uint8Array {
  const E = ESCPOSEncoder
  const parts: Uint8Array[] = []

  // Initialize printer + select code page
  parts.push(E.initialize())
  parts.push(E.selectCodePage858())

  // ── Store header ──
  parts.push(E.setAlign('center'))
  parts.push(E.setBold(true))
  parts.push(E.setFontSize('double'))
  parts.push(E.text(store.name))
  parts.push(E.newline())

  // Reset to normal for address/phone
  parts.push(E.setFontSize('normal'))
  parts.push(E.setBold(false))
  parts.push(E.text(store.address))
  parts.push(E.newline())
  parts.push(E.text(`Tel: ${store.phone}`))
  parts.push(E.newline())

  // ── Separator ──
  parts.push(E.setAlign('left'))
  parts.push(E.separator('='))

  // ── Date and order number ──
  parts.push(E.text(twoColumns('Date:', formatDate(order.created_at))))
  parts.push(E.newline())
  // Use last 8 characters of the order ID for a short reference
  const orderRef = order.id.slice(-8).toUpperCase()
  parts.push(E.text(twoColumns('Commande:', `#${orderRef}`)))
  parts.push(E.newline())

  // ── Separator ──
  parts.push(E.separator())

  // ── Items ──
  for (const item of order.items) {
    // Line 1: Product name
    const itemName =
      item.name.length > RECEIPT_WIDTH
        ? item.name.slice(0, RECEIPT_WIDTH - 1) + '.'
        : item.name
    parts.push(E.text(itemName))
    parts.push(E.newline())

    // Line 2: qty x price = total (right-aligned)
    const qtyPrice = `  ${item.qty} x ${formatFCFA(item.price)}`
    const itemTotal = formatFCFA(item.price * item.qty)
    parts.push(E.text(twoColumns(qtyPrice, itemTotal)))
    parts.push(E.newline())

    // Item discount if any
    if (item.discount && item.discount > 0) {
      parts.push(E.text(twoColumns('  Remise', `-${formatFCFA(item.discount)}`)))
      parts.push(E.newline())
    }
  }

  // ── Separator ──
  parts.push(E.separator())

  // ── Subtotal ──
  parts.push(E.text(twoColumns('Sous-total', formatFCFA(order.subtotal))))
  parts.push(E.newline())

  // ── Discount (if any) ──
  if (order.discount > 0) {
    parts.push(E.text(twoColumns('Remise', `-${formatFCFA(order.discount)}`)))
    parts.push(E.newline())
  }

  // ── Tax (if any) ──
  if (order.tax > 0) {
    parts.push(E.text(twoColumns('TVA', formatFCFA(order.tax))))
    parts.push(E.newline())
  }

  // ── Separator ──
  parts.push(E.separator('='))

  // ── Total (bold, double size) ──
  parts.push(E.setBold(true))
  parts.push(E.setFontSize('double'))
  parts.push(E.setAlign('center'))
  parts.push(E.text(`TOTAL: ${formatFCFA(order.total)}`))
  parts.push(E.newline())
  parts.push(E.setFontSize('normal'))
  parts.push(E.setBold(false))

  // ── Separator ──
  parts.push(E.setAlign('left'))
  parts.push(E.separator())

  // ── Payment method ──
  parts.push(
    E.text(twoColumns('Paiement:', paymentLabel(order.payment_method))),
  )
  parts.push(E.newline())

  // ── Amount received and change (cash payments) ──
  if (
    order.payment_method === 'cash' &&
    order.amount_received !== undefined &&
    order.amount_received > 0
  ) {
    parts.push(
      E.text(twoColumns('Recu:', formatFCFA(order.amount_received))),
    )
    parts.push(E.newline())
    if (order.change_due !== undefined && order.change_due > 0) {
      parts.push(
        E.text(twoColumns('Monnaie:', formatFCFA(order.change_due))),
      )
      parts.push(E.newline())
    }
  }

  // ── Separator ──
  parts.push(E.separator())

  // ── Footer ──
  parts.push(E.setAlign('center'))
  parts.push(E.newline())
  parts.push(E.text('Merci pour votre visite!'))
  parts.push(E.newline())
  parts.push(E.setBold(true))
  parts.push(E.text(store.name))
  parts.push(E.newline())
  parts.push(E.setBold(false))

  // Feed some lines before cutting
  parts.push(E.feedLines(4))

  // ── Cut ──
  parts.push(E.cut())

  return E.concat(parts)
}

// ── Bluetooth Printer Class ─────────────────────────────────────────────────

export class BluetoothPrinter {
  private server: BluetoothRemoteGATTServer | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private status: PrinterStatus = 'disconnected'
  private deviceName = ''

  /**
   * Scan for Bluetooth printers using Web Bluetooth API.
   * Opens the browser's device picker filtered to known printer service UUIDs.
   * Returns the selected device or null if cancelled.
   */
  async scan(): Promise<BluetoothDevice | null> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth API non disponible dans ce navigateur')
    }

    try {
      // Try with service UUID filters first -- this is the most reliable approach
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          // Filter by known printer service UUIDs
          { services: [0x18f0] },
          { services: [0xff00] },
          { services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] },
          { services: ['e7810a71-73ae-499d-8c15-faa9aef0c3f2'] },
          // Filter by common printer brand name prefixes
          { namePrefix: 'EPSON' },
          { namePrefix: 'STAR' },
          { namePrefix: 'RONGTA' },
          { namePrefix: 'GOOJPRT' },
          { namePrefix: 'MTP' },
          { namePrefix: 'POS' },
          { namePrefix: 'MPT' },
          { namePrefix: 'BlueTooth Printer' },
          { namePrefix: 'Printer' },
          { namePrefix: 'RPP' },
          { namePrefix: 'SPP' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'XP-' },
          { namePrefix: 'ZJ-' },
          { namePrefix: 'PT-' },
          { namePrefix: 'HM-' },
        ],
        optionalServices: PRINTER_SERVICE_UUIDS,
      })

      return device
    } catch (error) {
      // If the user cancelled the picker, DOMException name = 'NotFoundError'
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return null
      }
      // If no devices matched the filters, try with acceptAllDevices
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: PRINTER_SERVICE_UUIDS,
        })
        return device
      } catch (fallbackError) {
        if (
          fallbackError instanceof DOMException &&
          fallbackError.name === 'NotFoundError'
        ) {
          return null
        }
        throw fallbackError
      }
    }
  }

  /**
   * Connect to a Bluetooth device's GATT server and find the writable
   * characteristic for sending ESC/POS data.
   */
  async connect(device: BluetoothDevice): Promise<void> {
    this.deviceName = device.name ?? 'Imprimante BLE'
    this.status = 'disconnected'

    try {
      // Connect to GATT server
      const server = await device.gatt!.connect()
      this.server = server

      // Listen for disconnection events
      device.addEventListener('gattserverdisconnected', () => {
        this.status = 'disconnected'
        this.server = null
        this.characteristic = null
        console.info('[bluetooth] Printer disconnected:', this.deviceName)
      })

      // Find a writable characteristic by iterating services
      let writableChar: BluetoothRemoteGATTCharacteristic | null = null

      const services = await server.getPrimaryServices()

      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics()

          for (const char of characteristics) {
            // Check if characteristic supports write or writeWithoutResponse
            if (
              char.properties.write ||
              char.properties.writeWithoutResponse
            ) {
              // Prefer known UUIDs
              const isKnown = WRITABLE_CHARACTERISTIC_UUIDS.some(
                (uuid) =>
                  char.uuid ===
                  (typeof uuid === 'number'
                    ? `0000${uuid.toString(16).padStart(4, '0')}-0000-1000-8000-00805f9b34fb`
                    : uuid),
              )
              if (isKnown) {
                writableChar = char
                break
              }
              // Otherwise keep as fallback
              if (!writableChar) {
                writableChar = char
              }
            }
          }
          if (writableChar) break
        } catch {
          // Service may not be accessible, skip it
          continue
        }
      }

      if (!writableChar) {
        throw new Error(
          'Aucune caracteristique compatible trouvee sur cette imprimante',
        )
      }

      this.characteristic = writableChar
      this.status = 'connected'

      console.info(
        '[bluetooth] Connected to:',
        this.deviceName,
        '| Characteristic:',
        writableChar.uuid,
      )
    } catch (error) {
      this.status = 'error'
      this.server = null
      this.characteristic = null
      throw error
    }
  }

  /**
   * Disconnect cleanly from the printer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.server?.connected) {
        this.server.disconnect()
      }
    } catch {
      // Ignore disconnect errors
    } finally {
      this.server = null
      this.characteristic = null
      this.status = 'disconnected'
    }
  }

  /**
   * Write raw bytes to the printer, handling BLE chunking.
   * Most BLE devices have a maximum transfer unit (MTU) of ~512 bytes,
   * so we split large payloads into chunks.
   */
  async write(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Imprimante non connectee')
    }

    if (!this.server?.connected) {
      this.status = 'disconnected'
      throw new Error('Connexion Bluetooth perdue')
    }

    this.status = 'printing'

    try {
      const supportsWriteWithoutResponse =
        this.characteristic.properties.writeWithoutResponse

      for (let offset = 0; offset < data.length; offset += BLE_CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + BLE_CHUNK_SIZE)

        if (supportsWriteWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk)
        } else {
          await this.characteristic.writeValueWithResponse(chunk)
        }

        // Small delay between chunks to prevent buffer overflow on the printer
        if (offset + BLE_CHUNK_SIZE < data.length) {
          await new Promise((resolve) => setTimeout(resolve, 20))
        }
      }

      this.status = 'connected'
    } catch (error) {
      this.status = 'error'
      throw error
    }
  }

  /**
   * Get current printer status
   */
  getStatus(): PrinterStatus {
    // Re-evaluate in case GATT disconnected behind our back
    if (
      this.status === 'connected' &&
      this.server &&
      !this.server.connected
    ) {
      this.status = 'disconnected'
      this.server = null
      this.characteristic = null
    }
    return this.status
  }

  /**
   * Check if the printer is currently connected
   */
  isConnected(): boolean {
    return (
      this.status === 'connected' &&
      this.server !== null &&
      this.server.connected
    )
  }

  /**
   * Get the name of the connected device
   */
  getDeviceName(): string {
    return this.deviceName
  }
}

// ── Singleton Instance ──────────────────────────────────────────────────────

export const bluetoothPrinter = new BluetoothPrinter()
