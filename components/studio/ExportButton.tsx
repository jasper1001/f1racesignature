'use client'

import { useState } from 'react'
import { useStudioStore } from '@/lib/store'
import { isExportFree, UPGRADE_REASONS } from '@/lib/freemium'
import { EXPORT_FORMATS } from '@/lib/themes'
import { Analytics } from '@/lib/analytics'

export function ExportButton({ onBeforeExport }: { onBeforeExport?: () => void } = {}) {
  const [isExporting, setIsExporting] = useState(false)
  const { selectedDriverId, selectedRaceId, exportFormat, openUpgradeModal } = useStudioStore()

  const formatConfig = EXPORT_FORMATS.find((f) => f.id === exportFormat)!

  const handleExport = async () => {
    if (!isExportFree(exportFormat)) {
      Analytics.upgradeModalOpened('exportFormat')
      openUpgradeModal(UPGRADE_REASONS.exportFormat)
      return
    }
    if (!selectedDriverId || !selectedRaceId) return

    // Stop any lap playback so the export captures the full static poster
    onBeforeExport?.()

    setIsExporting(true)
    Analytics.exportClicked(exportFormat, selectedDriverId, selectedRaceId)

    try {
      const svgEl = document.getElementById('poster-svg') as SVGSVGElement | null
      if (!svgEl) return

      // Render at a 4K-class resolution: scale the format's logical size up so the
      // long edge hits ~3840px. The poster is vector (SVG with a viewBox), so this
      // is lossless. We cap the long edge at 3840 to stay under iOS Safari's
      // ~16.7M-pixel canvas limit for every aspect ratio (mobile exports).
      const TARGET_LONG_EDGE = 3840
      const scale = Math.max(1, TARGET_LONG_EDGE / Math.max(formatConfig.width, formatConfig.height))
      const outW = Math.round(formatConfig.width * scale)
      const outH = Math.round(formatConfig.height * scale)

      // Serialize the SVG at the high-res intrinsic size so browsers rasterize it
      // crisply (some rasterize at the SVG's own size before scaling). This avoids
      // html2canvas entirely — no iframe cloning, no transform issues.
      const clone = svgEl.cloneNode(true) as SVGSVGElement
      clone.setAttribute('width', String(outW))
      clone.setAttribute('height', String(outH))
      clone.setAttribute('preserveAspectRatio', 'none') // fill exactly, matching prior stretch
      const svgString = new XMLSerializer().serializeToString(clone)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = outW
          canvas.height = outH
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)

          const link = document.createElement('a')
          link.download = `f1racesignature-${selectedDriverId}-${selectedRaceId}.png`
          link.href = canvas.toDataURL('image/png', 1.0)
          link.click()

          URL.revokeObjectURL(url)
          Analytics.exportCompleted(exportFormat, selectedDriverId, selectedRaceId)
          resolve()
        }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')) }
        img.src = url
      })
    } finally {
      setIsExporting(false)
    }
  }

  const canExport = Boolean(selectedDriverId && selectedRaceId)

  return (
    <button
      onClick={handleExport}
      disabled={!canExport || isExporting}
      title="Export poster"
      data-track="studio_export"
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#d4a017] text-black border border-[#d4a017]/30 rounded-lg hover:bg-[#e8b84b] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="hidden sm:inline">Exporting…</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
            <path d="M7 1v8M4 6l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Export Poster</span>
        </>
      )}
    </button>
  )
}
