'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/studio/Sidebar'
import { PosterPreview } from '@/components/studio/PosterPreview'
import { StatsPanel } from '@/components/studio/StatsPanel'
import { ExportButton } from '@/components/studio/ExportButton'
import { SurpriseButton } from '@/components/studio/SurpriseButton'
import { ShareButton } from '@/components/studio/ShareButton'
import { PlayButton } from '@/components/studio/PlayButton'
import { SaveButton } from '@/components/studio/SaveButton'
import { UpgradeModal } from '@/components/studio/UpgradeModal'
import { OnboardingModal } from '@/components/studio/OnboardingModal'
import { hasSeen, markSeen } from '@/lib/onboarding'
import Link from 'next/link'
import { useStudioStore } from '@/lib/store'
import { fetchDrivers, fetchRaces, fetchTelemetry, fetchCircuits } from '@/lib/data'
import { themeById } from '@/lib/themes'
import { Analytics } from '@/lib/analytics'
import type { VizMode, ArtTheme } from '@/lib/types'

const ZOOM_STEP = 0.15
const ZOOM_MIN  = 0.4
const ZOOM_MAX  = 2.0

type MobileTab = 'controls' | 'preview' | 'stats'

export default function StudioPage() {
  const { selectedDriverId, selectedRaceId, vizMode, theme, compareEnabled, compareRaceId } = useStudioStore()
  const applyConfig = useStudioStore((s) => s.applyConfig)
  const [zoom, setZoom] = useState(0.85)
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview')

  // Lap playback
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const PLAYBACK_MS = 7000

  useEffect(() => {
    if (!isPlaying) return
    let start: number | null = null
    const tick = (ts: number) => {
      if (start === null) start = ts
      const p = ((ts - start) % PLAYBACK_MS) / PLAYBACK_MS
      setProgress(p)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying])

  // Any change to the poster config stops playback so the change is visible
  useEffect(() => {
    setIsPlaying(false)
  }, [selectedDriverId, selectedRaceId, vizMode, theme, compareEnabled, compareRaceId])

  // Apply a preset passed in via URL (e.g. clicking a gallery poster)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const driverId = params.get('driver') ?? undefined
    const raceId = params.get('race') ?? undefined
    const viz = params.get('viz') ?? undefined
    const themeParam = params.get('theme') ?? undefined
    if (driverId || raceId || viz || themeParam) {
      applyConfig({
        driverId,
        raceId,
        vizMode: viz as VizMode | undefined,
        theme: themeParam as ArtTheme | undefined,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const zoomIn    = useCallback(() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))), [])
  const zoomOut   = useCallback(() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))), [])
  const zoomReset = useCallback(() => setZoom(0.85), [])

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(z - e.deltaY * 0.001).toFixed(2))))
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  // First-visit onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    if (!hasSeen('studio_tour')) setShowOnboarding(true)
  }, [])
  const closeOnboarding = () => {
    markSeen('studio_tour')
    setShowOnboarding(false)
  }

  useEffect(() => { Analytics.studioOpened() }, [])

  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'],  queryFn: fetchDrivers })
  const { data: races   = [] } = useQuery({ queryKey: ['races'],    queryFn: fetchRaces })
  const { data: circuits = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })

  const selectedRace    = races.find((r) => r.id === selectedRaceId) ?? null
  const selectedDriver  = drivers.find((d) => d.id === selectedDriverId) ?? null
  const selectedCircuit = selectedRace ? (circuits[selectedRace.circuit] ?? null) : null

  const { data: telemetry = null } = useQuery({
    queryKey: ['telemetry', selectedRace?.telemetryFile],
    queryFn: () => fetchTelemetry(selectedRace!.telemetryFile),
    enabled: Boolean(selectedRace?.telemetryFile),
  })

  // Compare (head-to-head) lap
  const compareRace = races.find((r) => r.id === compareRaceId) ?? null
  const compareDriver = compareRace ? (drivers.find((d) => d.id === compareRace.driverId) ?? null) : null
  const { data: compareTelemetry = null } = useQuery({
    queryKey: ['telemetry', compareRace?.telemetryFile],
    queryFn: () => fetchTelemetry(compareRace!.telemetryFile),
    enabled: Boolean(compareEnabled && compareRace?.telemetryFile),
  })

  const activeTheme = themeById(theme)

  const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'controls',
      label: 'Controls',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'preview',
      label: 'Poster',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 5h6M5 8h4M5 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 13V8M6 13V5M10 13V7M14 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      <Header />

      {/* ── Desktop layout ── */}
      <div className="hidden md:flex h-screen pt-14 overflow-hidden" style={{ background: '#030303' }}>
        <Sidebar drivers={drivers} races={races} />

        <main className="flex-1 flex flex-col overflow-hidden" style={{ background: '#050505' }}>
          {/* Toolbar */}
          <div className="flex-shrink-0 border-b border-[#0f0f0f] px-6 py-2.5 flex items-center justify-between bg-[#030303]/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setShowOnboarding(true)}
                title="How it works"
                data-track="studio_help"
                className="w-5 h-5 flex items-center justify-center rounded-full border border-[#2a2a2a] text-[#666666] hover:text-[#d4a017] hover:border-[#d4a017]/50 transition-colors cursor-pointer text-[11px] font-bold"
              >
                ?
              </button>
              <span className="text-[#333333] font-mono uppercase tracking-widest">Studio</span>
              {selectedDriver && <><span className="text-[#1a1a1a]">/</span><span className="text-[#555555]">{selectedDriver.name}</span></>}
              {selectedRace   && <><span className="text-[#1a1a1a]">/</span><span className="text-[#555555]">{selectedRace.circuit} {selectedRace.year}</span></>}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[#333333] text-xs font-mono">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTheme.primaryLine, opacity: 0.7 }} />
                {activeTheme.name}
              </div>
              {/* Zoom */}
              <div className="flex items-center gap-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-1 py-1">
                <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN} className="w-6 h-6 flex items-center justify-center text-[#555555] hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <button onClick={zoomReset} className="min-w-[38px] text-center text-[#555555] hover:text-white text-xs font-mono transition-colors cursor-pointer px-1">{Math.round(zoom * 100)}%</button>
                <button onClick={zoomIn}  disabled={zoom >= ZOOM_MAX} className="w-6 h-6 flex items-center justify-center text-[#555555] hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              <PlayButton isPlaying={isPlaying} onToggle={() => setIsPlaying((p) => !p)} disabled={!telemetry} />
              <SurpriseButton />
              <SaveButton />
              <ShareButton />
              <ExportButton onBeforeExport={() => setIsPlaying(false)} />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto" style={{ minHeight: 0 }}>
            {!selectedDriver ? (
              <EmptyState />
            ) : (
              <div className="poster-wrapper" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
                <PosterPreview driver={selectedDriver} race={selectedRace} telemetry={telemetry} circuit={selectedCircuit} theme={activeTheme} vizMode={vizMode} isFreeTier compareDriver={compareEnabled ? compareDriver : null} compareTelemetry={compareEnabled ? compareTelemetry : null} playbackProgress={isPlaying ? progress : null} />
              </div>
            )}
          </div>
        </main>

        <StatsPanel driver={selectedDriver} race={selectedRace} telemetry={telemetry} compareDriver={compareEnabled ? compareDriver : null} compareTelemetry={compareEnabled ? compareTelemetry : null} />
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex md:hidden flex-col h-screen pt-14" style={{ background: '#030303' }}>
        {/* Mobile tab content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {mobileTab === 'controls' && (
              <motion.div key="controls" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
                <Sidebar drivers={drivers} races={races} mobile />
              </motion.div>
            )}

            {mobileTab === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex flex-col">
                {/* Mini toolbar */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-[#0f0f0f] bg-[#030303]/80">
                  <div className="flex items-center gap-2 text-[#333333] text-xs font-mono">
                    <button
                      onClick={() => setShowOnboarding(true)}
                      title="How it works"
                      className="w-5 h-5 flex items-center justify-center rounded-full border border-[#2a2a2a] text-[#666666] text-[11px] font-bold"
                    >
                      ?
                    </button>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTheme.primaryLine, opacity: 0.7 }} />
                    {activeTheme.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayButton isPlaying={isPlaying} onToggle={() => setIsPlaying((p) => !p)} disabled={!telemetry} />
                    <SurpriseButton />
                    <SaveButton />
                    <ShareButton />
                    <ExportButton onBeforeExport={() => setIsPlaying(false)} />
                  </div>
                </div>
                {/* Poster — scaled to fit mobile screen */}
                <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                  {!selectedDriver ? (
                    <div className="text-center">
                      <p className="text-[#444444] text-sm mb-1">Select a driver to begin</p>
                      <p className="text-[#2a2a2a] text-xs">Tap Controls tab below</p>
                    </div>
                  ) : (
                    <div
                      className="poster-wrapper origin-top"
                      style={{
                        transform: 'scale(0.52)',
                        transformOrigin: 'top center',
                        marginBottom: '-310px',
                      }}
                    >
                      <PosterPreview driver={selectedDriver} race={selectedRace} telemetry={telemetry} circuit={selectedCircuit} theme={activeTheme} vizMode={vizMode} isFreeTier compareDriver={compareEnabled ? compareDriver : null} compareTelemetry={compareEnabled ? compareTelemetry : null} playbackProgress={isPlaying ? progress : null} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {mobileTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
                <div className="w-full">
                  <StatsPanel driver={selectedDriver} race={selectedRace} telemetry={telemetry} mobile compareDriver={compareEnabled ? compareDriver : null} compareTelemetry={compareEnabled ? compareTelemetry : null} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom tab bar */}
        <div className="flex-shrink-0 flex border-t border-[#111111] bg-[#030303]">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors cursor-pointer ${
                mobileTab === tab.id ? 'text-[#d4a017]' : 'text-[#444444] hover:text-[#888888]'
              }`}
            >
              <span className={mobileTab === tab.id ? 'text-[#d4a017]' : 'text-[#444444]'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <UpgradeModal />
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
    </>
  )
}

function EmptyState() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-[#333333]" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 3 L16 12M16 20 L16 29M3 16 L12 16M20 16 L29 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[#444444] text-sm mb-1">Select a driver to begin</p>
      <p className="text-[#2a2a2a] text-xs">Choose from the sidebar on the left</p>
    </div>
  )
}
