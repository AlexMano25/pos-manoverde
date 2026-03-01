import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

// ── Props ────────────────────────────────────────────────────────────────

interface BarcodeDisplayProps {
  value: string
  width?: number
  height?: number
  format?: string
  displayValue?: boolean
}

// ── Component ────────────────────────────────────────────────────────────

export default function BarcodeDisplay({
  value,
  width = 2,
  height = 60,
  format = 'CODE128',
  displayValue = true,
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !value) return

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        margin: 5,
        fontSize: 12,
        textMargin: 2,
      })
    } catch (err) {
      console.error('Barcode generation failed:', err)
    }
  }, [value, width, height, format, displayValue])

  if (!value) return null

  return (
    <div style={{ textAlign: 'center' }}>
      <svg ref={svgRef} />
    </div>
  )
}
