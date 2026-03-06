import React, { useRef, useState } from 'react'
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

// ── Color palette ────────────────────────────────────────────────────────

const C = {
  primary: '#2563eb',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  danger: '#dc2626',
} as const

// ── Props ────────────────────────────────────────────────────────────────

interface ImageUploadProps {
  value?: string
  onChange: (dataUrl: string | undefined) => void
  uploadLabel?: string
  cameraLabel?: string
  removeLabel?: string
}

// ── Compression helper ───────────────────────────────────────────────────

function compressImage(file: File, maxSize = 400, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = reject
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if needed
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize)
            width = maxSize
          } else {
            width = Math.round((width / height) * maxSize)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas context failed'))

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ── Component ────────────────────────────────────────────────────────────

export default function ImageUpload({
  value,
  onChange,
  uploadLabel = 'Upload',
  cameraLabel = 'Camera',
  removeLabel = 'Remove',
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } catch (err) {
      console.error('Image compression failed:', err)
    } finally {
      setLoading(false)
      // Reset input so same file can be selected again
      e.target.value = ''
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  }

  const previewStyle: React.CSSProperties = {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    border: `2px solid ${C.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    position: 'relative',
  }

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }

  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    color: C.textSecondary,
  }

  const btnRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  }

  const btnStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 6,
    border: `1px solid ${C.border}`,
    backgroundColor: C.card,
    color: C.text,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  const removeBtnStyle: React.CSSProperties = {
    ...btnStyle,
    color: C.danger,
    borderColor: C.danger + '40',
  }

  const removeOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }

  return (
    <div style={containerStyle}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Preview */}
      <div style={previewStyle}>
        {value ? (
          <>
            <img src={value} alt="Preview" style={imgStyle} />
            <button
              type="button"
              style={removeOverlayStyle}
              onClick={() => onChange(undefined)}
              title={removeLabel}
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div style={placeholderStyle}>
            {loading ? (
              <Loader2 size={28} color={C.primary} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <ImageIcon size={32} color={C.border} />
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={btnRowStyle}>
        <button
          type="button"
          style={btnStyle}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Upload size={14} /> {uploadLabel}
        </button>
        <button
          type="button"
          style={{
            ...btnStyle,
            backgroundColor: C.primary,
            color: '#fff',
            borderColor: C.primary,
          }}
          onClick={() => cameraInputRef.current?.click()}
          disabled={loading}
        >
          <Camera size={14} /> {cameraLabel}
        </button>
        {value && (
          <button
            type="button"
            style={removeBtnStyle}
            onClick={() => onChange(undefined)}
          >
            <X size={14} /> {removeLabel}
          </button>
        )}
      </div>
    </div>
  )
}
