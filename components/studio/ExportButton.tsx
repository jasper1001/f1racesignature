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
      const { default: html2canvas } = await import('html2canvas')
      const svgEl = document.getElementById('poster-svg')
      if (!svgEl) return

      const canvas = await html2canvas(svgEl.closest('.poster-wrapper') as HTMLElement ?? svgEl as unknown as HTMLElement, {
        backgroundColor: null,
        scale: formatConfig.width / 480,
        useCORS: true,
        logging: false,
      })

      const link = document.createElement('a')
      link.download = `f1racesignature-${selectedDriverId}-${selectedRaceId}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()

      // Fired only on a successful download — this is the real conversion.
      Analytics.exportCompleted(exportFormat, selectedDriverId, selectedRaceId)
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
      className="min-w-[140px]"
    >
      {isExporting ? 'Exporting…' : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 10v1.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export Poster
        </>
      )}
    </Button>
  )
}
