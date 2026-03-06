import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, Keyboard } from 'lucide-react'
import { useLanguageStore } from '../../stores/languageStore'

type Props = {
  onScan: (barcode: string) => void
  onClose: () => void
}

const SCAN_INTERVAL = 250 // ms between scans

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const { t } = useLanguageStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetector | null>(null)
  const scanningRef = useRef(true)

  const [manualMode, setManualMode] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [isSupported] = useState(
    () => typeof window !== 'undefined' && !!window.BarcodeDetector,
  )

  // Start camera + detector
  useEffect(() => {
    if (manualMode) return

    if (!isSupported) {
      setManualMode(true)
      return
    }

    let mounted = true

    const start = async () => {
      try {
        detectorRef.current = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
        })

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // Start scanning loop
        scanLoop()
      } catch (err) {
        if (!mounted) return
        console.error('[BarcodeScanner] camera error:', err)
        setCameraError(
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera access denied'
            : 'Camera not available',
        )
        setManualMode(true)
      }
    }

    start()

    return () => {
      mounted = false
      scanningRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [manualMode, isSupported])

  const scanLoop = useCallback(async () => {
    while (scanningRef.current) {
      if (videoRef.current && detectorRef.current && videoRef.current.readyState >= 2) {
        try {
          const barcodes = await detectorRef.current.detect(videoRef.current)
          if (barcodes.length > 0) {
            const value = barcodes[0].rawValue
            if (value) {
              scanningRef.current = false
              // Stop camera
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
              }
              onScan(value)
              return
            }
          }
        } catch {
          // Detection failed, continue
        }
      }
      await new Promise((r) => setTimeout(r, SCAN_INTERVAL))
    }
  }, [onScan])

  const handleManualSubmit = () => {
    const v = manualValue.trim()
    if (v) onScan(v)
  }

  // Scanner overlay labels
  const scannerLabels = {
    pointCamera: (t as Record<string, unknown>).scanner
      ? ((t as Record<string, unknown>).scanner as Record<string, string>).pointCamera
      : 'Pointez la caméra vers le code-barre',
    manualEntry: (t as Record<string, unknown>).scanner
      ? ((t as Record<string, unknown>).scanner as Record<string, string>).manualEntry
      : 'Saisie manuelle',
    notSupported: (t as Record<string, unknown>).scanner
      ? ((t as Record<string, unknown>).scanner as Record<string, string>).notSupported
      : 'Scanner non supporté',
    scanBarcode: (t as Record<string, unknown>).scanner
      ? ((t as Record<string, unknown>).scanner as Record<string, string>).scanBarcode
      : 'Scanner un code-barre',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 2,
      }}>
        <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
          {scannerLabels.scanBarcode}
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          {!manualMode && (
            <button
              onClick={() => {
                scanningRef.current = false
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((t) => t.stop())
                }
                setManualMode(true)
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
            >
              <Keyboard size={16} /> {scannerLabels.manualEntry}
            </button>
          )}
          {manualMode && isSupported && (
            <button
              onClick={() => {
                setCameraError('')
                scanningRef.current = true
                setManualMode(false)
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
            >
              <Camera size={16} /> Camera
            </button>
          )}
          <button
            onClick={() => {
              scanningRef.current = false
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
              }
              onClose()
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 8,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>
      </div>

      {/* Camera view */}
      {!manualMode && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            playsInline
            muted
          />
          {/* Scan guide overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '75%',
              maxWidth: 350,
              height: 120,
              border: '3px solid rgba(37, 99, 235, 0.8)',
              borderRadius: 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
            }} />
          </div>
          {/* Label below guide */}
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: 0,
            right: 0,
            textAlign: 'center',
          }}>
            <span style={{
              color: '#fff',
              fontSize: 14,
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: '8px 16px',
              borderRadius: 8,
            }}>
              {scannerLabels.pointCamera}
            </span>
          </div>
        </div>
      )}

      {/* Manual input */}
      {manualMode && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            {cameraError && (
              <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>
                {cameraError}
              </p>
            )}
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
              {scannerLabels.manualEntry}
            </p>
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="EAN / UPC / Code"
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 18,
                fontFamily: 'monospace',
                borderRadius: 10,
                border: '2px solid #334155',
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                outline: 'none',
                textAlign: 'center',
                letterSpacing: 2,
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualValue.trim()}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '14px 0',
                borderRadius: 10,
                border: 'none',
                backgroundColor: manualValue.trim() ? '#2563eb' : '#334155',
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: manualValue.trim() ? 'pointer' : 'default',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
