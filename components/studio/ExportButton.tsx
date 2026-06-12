'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
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

      // Serialize the SVG and draw it onto a canvas at the target resolution.
      // This avoids html2canvas entirely — no iframe cloning, no transform issues.
      const svgString = new XMLSerializer().serializeToString(svgEl)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = formatConfig.width
          canvas.height = formatConfig.height
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
    <Button
      onClick={handleExport}
      variant="gold"
      size="md"
      isLoading={isExporting}
      disabled={!canExport || isExporting}
      className="sm:min-w-[140px]"
    >
      {isExporting ? (
        <span className="hidden sm:inline">Exporting…</span>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Export Poster</span>
        </>
      )}
    </Button>
  )
}
