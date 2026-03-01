import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, QrCode } from 'lucide-react'
import { useLanguageStore } from '../../stores/languageStore'

interface QRCodeDisplayProps {
  url: string
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ url }) => {
  const [copied, setCopied] = useState(false)
  const { t } = useLanguageStore()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          color: '#2563eb',
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        <QrCode size={20} />
        {t.qrCode.title}
      </div>

      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
        {t.qrCode.description}
      </p>

      <div
        style={{
          display: 'inline-block',
          padding: 16,
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          marginBottom: 16,
        }}
      >
        <QRCodeSVG
          value={url}
          size={180}
          level="M"
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>
        {t.qrCode.scanToConnect}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        <code
          style={{
            fontSize: 12,
            padding: '6px 12px',
            backgroundColor: '#f1f5f9',
            borderRadius: 6,
            color: '#1e293b',
            fontFamily: 'monospace',
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {url}
        </code>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            backgroundColor: copied ? '#f0fdf4' : '#ffffff',
            color: copied ? '#16a34a' : '#64748b',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t.qrCode.copied : t.qrCode.copyUrl}
        </button>
      </div>
    </div>
  )
}

export default QRCodeDisplay
