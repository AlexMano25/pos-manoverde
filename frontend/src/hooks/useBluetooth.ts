// ---------------------------------------------------------------------------
// useBluetooth -- React hook for Bluetooth thermal printer management
//
// - Wraps the BluetoothPrinter singleton service
// - Manages printer status, name, and Web Bluetooth API support detection
// - Provides scan/connect, disconnect, and print receipt actions
// - Handles errors gracefully with user-friendly messages
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import {
  bluetoothPrinter,
  buildReceipt,
  ESCPOSEncoder,
} from '../services/bluetooth'
import type { Order, PrinterStatus } from '../types'

/** Store info needed to build a receipt header */
type StoreInfo = {
  name: string
  address: string
  phone: string
}

/** Return type of the useBluetooth hook */
type UseBluetoothReturn = {
  /** Current printer connection status */
  printerStatus: PrinterStatus
  /** Name of the connected Bluetooth device */
  printerName: string
  /** Whether the Web Bluetooth API is available in this browser */
  isSupported: boolean
  /** Scan for nearby Bluetooth printers and connect to the selected one */
  scanAndConnect: () => Promise<void>
  /** Disconnect from the currently connected printer */
  disconnect: () => Promise<void>
  /** Print a receipt for the given order */
  printReceipt: (order: Order, storeInfo: StoreInfo) => Promise<void>
  /** Open the cash drawer (if supported by the printer) */
  openCashDrawer: () => Promise<void>
  /** Last error message (cleared on next successful operation) */
  error: string | null
}

/**
 * Check if the Web Bluetooth API is available in the current browser.
 * Returns false on Firefox, most mobile browsers, and non-secure contexts.
 */
function checkBluetoothSupport(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.bluetooth !== 'undefined' &&
    typeof navigator.bluetooth.requestDevice === 'function'
  )
}

export function useBluetooth(): UseBluetoothReturn {
  const [printerStatus, setPrinterStatus] =
    useState<PrinterStatus>('disconnected')
  const [printerName, setPrinterName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => checkBluetoothSupport())

  // Poll printer status periodically to catch disconnections
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = bluetoothPrinter.getStatus()
      setPrinterStatus((prev) => {
        if (prev !== currentStatus) return currentStatus
        return prev
      })

      // Update name in case it changed
      const currentName = bluetoothPrinter.getDeviceName()
      setPrinterName((prev) => {
        if (prev !== currentName) return currentName
        return prev
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Scan for Bluetooth printers and connect to the one selected by the user
   */
  const scanAndConnect = useCallback(async () => {
    if (!isSupported) {
      setError(
        'Le Bluetooth Web n\'est pas disponible dans ce navigateur. ' +
          'Utilisez Chrome ou Edge sur un ordinateur.',
      )
      return
    }

    setError(null)
    setPrinterStatus('disconnected')

    try {
      const device = await bluetoothPrinter.scan()

      if (!device) {
        // User cancelled the picker
        return
      }

      setPrinterName(device.name ?? 'Imprimante BLE')

      await bluetoothPrinter.connect(device)
      setPrinterStatus('connected')
      setPrinterName(bluetoothPrinter.getDeviceName())
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      setPrinterStatus('error')
      console.error('[useBluetooth] scanAndConnect error:', err)
    }
  }, [isSupported])

  /**
   * Disconnect from the currently connected printer
   */
  const disconnect = useCallback(async () => {
    setError(null)
    try {
      await bluetoothPrinter.disconnect()
      setPrinterStatus('disconnected')
      setPrinterName('')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      console.error('[useBluetooth] disconnect error:', err)
    }
  }, [])

  /**
   * Print a receipt for the given order
   */
  const printReceipt = useCallback(
    async (order: Order, storeInfo: StoreInfo) => {
      setError(null)

      if (!bluetoothPrinter.isConnected()) {
        setError(
          'Imprimante non connectee. Veuillez connecter une imprimante Bluetooth.',
        )
        setPrinterStatus('disconnected')
        return
      }

      try {
        setPrinterStatus('printing')

        const receiptData = buildReceipt(order, storeInfo)
        await bluetoothPrinter.write(receiptData)

        setPrinterStatus('connected')
      } catch (err) {
        const message = getErrorMessage(err)
        setError(message)
        setPrinterStatus('error')
        console.error('[useBluetooth] printReceipt error:', err)

        // If the connection was lost, update status accordingly
        if (!bluetoothPrinter.isConnected()) {
          setPrinterStatus('disconnected')
        }
      }
    },
    [],
  )

  /**
   * Open the cash drawer (sends ESC/POS cash drawer command)
   */
  const openCashDrawer = useCallback(async () => {
    setError(null)

    if (!bluetoothPrinter.isConnected()) {
      setError('Imprimante non connectee.')
      return
    }

    try {
      await bluetoothPrinter.write(ESCPOSEncoder.openCashDrawer())
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      console.error('[useBluetooth] openCashDrawer error:', err)
    }
  }, [])

  return {
    printerStatus,
    printerName,
    isSupported,
    scanAndConnect,
    disconnect,
    printReceipt,
    openCashDrawer,
    error,
  }
}

// ── Error message helpers ───────────────────────────────────────────────────

/**
 * Convert unknown errors into user-friendly French messages
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotFoundError':
        return 'Aucune imprimante trouvee. Verifiez que l\'imprimante est allumee et le Bluetooth active.'
      case 'SecurityError':
        return 'Acces Bluetooth refuse. Autorisez l\'acces Bluetooth dans les parametres du navigateur.'
      case 'NetworkError':
        return 'Erreur de connexion Bluetooth. L\'imprimante est peut-etre hors de portee.'
      case 'NotSupportedError':
        return 'Cette operation Bluetooth n\'est pas supportee par votre appareil.'
      case 'AbortError':
        return 'Operation annulee.'
      case 'InvalidStateError':
        return 'L\'imprimante est dans un etat invalide. Essayez de la redemarrer.'
      default:
        return `Erreur Bluetooth: ${err.message}`
    }
  }

  if (err instanceof Error) {
    return err.message
  }

  return 'Une erreur inattendue est survenue avec l\'imprimante.'
}
