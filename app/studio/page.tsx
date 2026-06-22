'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/studio/Sidebar'
import { PosterPreview, type ComparisonLap } from '@/components/studio/PosterPreview'
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
import { themeById, EXPORT_FORMATS } from '@/lib/themes'
import { recordLapVideo, canRecordMp4 } from '@/lib/lapVideo'
import { Analytics } from '@/lib/analytics'
import type { VizMode, ArtTheme } from '@/lib/types'

const ZOOM_STEP = 0.15
const ZOOM_MIN  = 0.4
const ZOOM_MAX  = 2.0

// Poster intrinsic size (matches PosterPreview) — used to fit it to the screen
// in fullscreen mode.
const POSTER_W = 720
const POSTER_H = 800

type MobileTab = 'controls' | 'preview' | 'stats'

export default function StudioPage() {
  const { selectedDriverId, selectedRaceId, vizMode, theme, exportFormat, compareEnabled, compareRaceIds } = useStudioStore()
  const applyConfig = useStudioStore((s) => s.applyConfig)
  const [zoom, setZoom] = useState(0.85)
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview')

  // Fullscreen canvas — overlay the poster scaled to fit the viewport
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fsScale, setFsScale] = useState(1)
  useEffect(() => {
    if (!isFullscreen) return
    const compute = () => {
      const pad = 64
      const s = Math.min((window.innerWidth - pad) / POSTER_W, (window.innerHeight - pad) / POSTER_H)
      setFsScale(+s.toFixed(3))
    }
    compute()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('resize', compute)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('keydown', onKey)
    }
  }, [isFullscreen])

  // Lap playback
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const PLAYBACK_MS = 7000

  // MP4 export of the replay lap. While recording, `captureProgress` drives the
  // poster to an exact frame (deterministically, frame-by-frame) instead of the
  // live rAF loop, so we can encode H.264 with WebCodecs.
  const [captureProgress, setCaptureProgress] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordPct, setRecordPct] = useState(0)
  // The value the poster animates to: a capture frame when recording, else the
  // live playback progress (or null when idle).
  const livePlayback = captureProgress !== null ? captureProgress : (isPlaying ? progress : null)

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
  }, [selectedDriverId, selectedRaceId, vizMode, theme, compareEnabled, compareRaceIds])

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

  // Leaving the studio with no driver selected shouldn't strand the overlay
  useEffect(() => {
    if (!selectedDriver) setIsFullscreen(false)
  }, [selectedDriver])

  const { data: telemetry = null } = useQuery({
    queryKey: ['telemetry', selectedRace?.telemetryFile],
    queryFn: () => fetchTelemetry(selectedRace!.telemetryFile),
    enabled: Boolean(selectedRace?.telemetryFile),
  })

  // Compare (head-to-head) laps — up to two, so three cars total. Two fixed
  // telemetry queries (the cap is two) keep us within the rules of hooks.
  const cmpRace0 = races.find((r) => r.id === compareRaceIds[0]) ?? null
  const cmpRace1 = races.find((r) => r.id === compareRaceIds[1]) ?? null
  const { data: cmpTel0 = null } = useQuery({
    queryKey: ['telemetry', cmpRace0?.telemetryFile],
    queryFn: () => fetchTelemetry(cmpRace0!.telemetryFile),
    enabled: Boolean(compareEnabled && cmpRace0?.telemetryFile),
  })
  const { data: cmpTel1 = null } = useQuery({
    queryKey: ['telemetry', cmpRace1?.telemetryFile],
    queryFn: () => fetchTelemetry(cmpRace1!.telemetryFile),
    enabled: Boolean(compareEnabled && cmpRace1?.telemetryFile),
  })

  const compares: ComparisonLap[] = []
  if (compareEnabled && cmpRace0) {
    compares.push({ driver: drivers.find((d) => d.id === cmpRace0.driverId) ?? null, telemetry: cmpTel0, race: cmpRace0 })
  }
  if (compareEnabled && cmpRace1) {
    compares.push({ driver: drivers.find((d) => d.id === cmpRace1.driverId) ?? null, telemetry: cmpTel1, race: cmpRace1 })
  }

  const activeTheme = themeById(theme)

  // ── Export the animated replay lap as a true H.264 MP4 (iOS-friendly) ──
  const handleRecordMp4 = async () => {
    if (!selectedDriver || !telemetry || isRecording) return
    if (!canRecordMp4()) {
      alert('Sorry — MP4 export needs a browser with WebCodecs (try the latest Chrome, Edge, or Safari).')
      return
    }

    // Use the selected export format's aspect (e.g. Instagram square), sized for
    // video: scale so the short edge is ~1080, capped, and even (H.264 needs
    // even dimensions). The poster art is letterboxed onto it, matching the
    // still-image export.
    const fmt = EXPORT_FORMATS.find((f) => f.id === exportFormat) ?? EXPORT_FORMATS[0]
    const targetShort = 1080
    const s = targetShort / Math.min(fmt.width, fmt.height)
    const width = Math.round((fmt.width * s) / 2) * 2
    const height = Math.round((fmt.height * s) / 2) * 2

    const fit = Math.min(width / POSTER_W, height / POSTER_H)
    const drawW = Math.round(POSTER_W * fit)
    const drawH = Math.round(POSTER_H * fit)
    const dx = Math.round((width - drawW) / 2)
    const dy = Math.round((height - drawH) / 2)
    const bg = activeTheme.bg

    setIsPlaying(false)
    setIsRecording(true)
    setRecordPct(0)

    // Loop the lap so the clip is long enough to use as a Reel/TikTok. `t` runs
    // 0..1 across the whole timeline; map it to per-lap progress so each loop is
    // a clean 0→1 sweep. The recorded loop runs a touch slower than the live
    // preview (RECORD_LOOP_MS > PLAYBACK_MS) so the motion reads more cinematic.
    const LOOPS = 2
    const RECORD_LOOP_MS = 9000

    const drawFrame = (t: number, ctx: CanvasRenderingContext2D) =>
      new Promise<void>((resolve, reject) => {
        // Drive the live poster to this exact frame, synchronously, then read it.
        flushSync(() => setCaptureProgress((t * LOOPS) % 1))
        const svgEl = document.getElementById('poster-svg') as SVGSVGElement | null
        if (!svgEl) { reject(new Error('poster not found')); return }
        const clone = svgEl.cloneNode(true) as SVGSVGElement
        clone.setAttribute('width', String(drawW))
        clone.setAttribute('height', String(drawH))
        const svgString = new XMLSerializer().serializeToString(clone)
        const url = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }))
        const img = new Image()
        img.onload = () => {
          ctx.fillStyle = bg
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, dx, dy, drawW, drawH)
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('frame render failed')) }
        img.src = url
      })

    try {
      const fps = 30
      const frames = Math.round((RECORD_LOOP_MS / 1000) * fps) * LOOPS
      Analytics.exportClicked('mp4_replay', selectedDriverId!, selectedRaceId!)
      const blob = await recordLapVideo({
        width, height, fps, frames,
        bitrate: 24_000_000, // 24 Mbps — crisp at 1080, good for re-encoding on upload
        drawFrame,
        onProgress: (done, total) => setRecordPct(Math.round((done / total) * 100)),
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `f1racesignature-${selectedDriverId}-${selectedRaceId}.mp4`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      Analytics.exportCompleted('mp4_replay', selectedDriverId!, selectedRaceId!)
    } catch (err) {
      console.error('MP4 export failed', err)
      alert('MP4 export failed. Your browser may not support H.264 encoding — try the latest Chrome or Edge.')
    } finally {
      setCaptureProgress(null)
      setIsRecording(false)
      setRecordPct(0)
    }
  }

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
                className="w-5 h-5 flex items-center justify-center rounded-full border border-[#2a2a2a] text-[#aaaaaa] hover:text-[#d4a017] hover:border-[#d4a017]/50 transition-colors cursor-pointer text-[11px] font-bold"
              >
                ?
              </button>
              <span className="text-[#aaaaaa] font-mono uppercase tracking-widest">Studio</span>
              {selectedDriver && <><span className="text-[#1a1a1a]">/</span><span className="text-[#aaaaaa]">{selectedDriver.name}</span></>}
              {selectedRace   && <><span className="text-[#1a1a1a]">/</span><span className="text-[#aaaaaa]">{selectedRace.circuit} {selectedRace.year}</span></>}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[#aaaaaa] text-xs font-mono">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTheme.primaryLine, opacity: 0.7 }} />
                {activeTheme.name}
              </div>
              {/* Zoom */}
              <div className="flex items-center gap-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg px-1 py-1">
                <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN} className="w-6 h-6 flex items-center justify-center text-[#aaaaaa] hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <button onClick={zoomReset} className="min-w-[38px] text-center text-[#aaaaaa] hover:text-white text-xs font-mono transition-colors cursor-pointer px-1">{Math.round(zoom * 100)}%</button>
                <button onClick={zoomIn}  disabled={zoom >= ZOOM_MAX} className="w-6 h-6 flex items-center justify-center text-[#aaaaaa] hover:text-white disabled:opacity-30 transition-colors cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              <button
                onClick={() => setIsFullscreen(true)}
                disabled={!selectedDriver}
                title="Fullscreen"
                className="w-8 h-8 flex items-center justify-center bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg text-[#aaaaaa] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 5V1h4M13 5V1H9M1 9v4h4M13 9v4H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <PlayButton isPlaying={isPlaying} onToggle={() => setIsPlaying((p) => !p)} disabled={!telemetry} />
              <RecordMp4Button onRecord={handleRecordMp4} disabled={!telemetry} isRecording={isRecording} pct={recordPct} />
              <SurpriseButton />
              <SaveButton />
              <ShareButton />
              <ExportButton onBeforeExport={() => setIsPlaying(false)} />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
            <div className="flex items-center justify-center p-6" style={{ minHeight: '100%' }}>
              {!selectedDriver ? (
                <EmptyState />
              ) : (
                <div className="poster-wrapper" style={{ zoom: zoom }}>
                  <PosterPreview driver={selectedDriver} race={selectedRace} telemetry={telemetry} circuit={selectedCircuit} theme={activeTheme} vizMode={vizMode} isFreeTier compares={compares} playbackProgress={livePlayback} />
                </div>
              )}
            </div>
          </div>
        </main>

        <StatsPanel driver={selectedDriver} race={selectedRace} telemetry={telemetry} compares={compares} />
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex md:hidden flex-col h-screen pt-14 overflow-x-hidden" style={{ background: '#030303' }}>
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
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-[#0f0f0f] bg-[#030303]/80">
                  <div className="flex items-center gap-2 text-[#aaaaaa] text-xs font-mono min-w-0 flex-1">
                    <button
                      onClick={() => setShowOnboarding(true)}
                      title="How it works"
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full border border-[#2a2a2a] text-[#aaaaaa] text-[11px] font-bold"
                    >
                      ?
                    </button>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: activeTheme.primaryLine, opacity: 0.7 }} />
                    <span className="truncate">{activeTheme.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      disabled={!selectedDriver}
                      title="Fullscreen"
                      className="w-7 h-7 flex items-center justify-center bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg text-[#aaaaaa] disabled:opacity-30 cursor-pointer"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M1 5V1h4M13 5V1H9M1 9v4h4M13 9v4H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <PlayButton isPlaying={isPlaying} onToggle={() => setIsPlaying((p) => !p)} disabled={!telemetry} />
                    <RecordMp4Button onRecord={handleRecordMp4} disabled={!telemetry} isRecording={isRecording} pct={recordPct} compact />
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
                      <p className="text-[#aaaaaa] text-sm mb-1">Select a driver to begin</p>
                      <p className="text-[#2a2a2a] text-xs">Tap Controls tab below</p>
                    </div>
                  ) : (
                    <div
                      className="poster-wrapper origin-top"
                      style={{
                        transform: 'scale(0.62)',
                        transformOrigin: 'top center',
                        marginBottom: '-244px',
                      }}
                    >
                      <PosterPreview driver={selectedDriver} race={selectedRace} telemetry={telemetry} circuit={selectedCircuit} theme={activeTheme} vizMode={vizMode} isFreeTier compares={compares} playbackProgress={livePlayback} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {mobileTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="absolute inset-0 overflow-y-auto">
                <div className="w-full">
                  <StatsPanel driver={selectedDriver} race={selectedRace} telemetry={telemetry} mobile compares={compares} />
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
                mobileTab === tab.id ? 'text-[#d4a017]' : 'text-[#aaaaaa] hover:text-[#aaaaaa]'
              }`}
            >
              <span className={mobileTab === tab.id ? 'text-[#d4a017]' : 'text-[#aaaaaa]'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fullscreen canvas overlay ── */}
      <AnimatePresence>
        {isFullscreen && selectedDriver && (
          <motion.div
            key="fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ background: '#000' }}
          >
            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <PlayButton isPlaying={isPlaying} onToggle={() => setIsPlaying((p) => !p)} disabled={!telemetry} />
              <RecordMp4Button onRecord={handleRecordMp4} disabled={!telemetry} isRecording={isRecording} pct={recordPct} />
              <button
                onClick={() => setIsFullscreen(false)}
                title="Exit fullscreen (Esc)"
                className="w-8 h-8 flex items-center justify-center bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg text-[#aaaaaa] hover:text-white transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 1v4H1M9 1v4h4M5 13V9H1M9 13V9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="poster-wrapper" style={{ transform: `scale(${fsScale})`, transformOrigin: 'center' }}>
              <PosterPreview driver={selectedDriver} race={selectedRace} telemetry={telemetry} circuit={selectedCircuit} theme={activeTheme} vizMode={vizMode} isFreeTier compares={compares} playbackProgress={livePlayback} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal />
      <OnboardingModal isOpen={showOnboarding} onClose={closeOnboarding} />
    </>
  )
}

function EmptyState() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-[#aaaaaa]" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M16 3 L16 12M16 20 L16 29M3 16 L12 16M20 16 L29 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[#aaaaaa] text-sm mb-1">Select a driver to begin</p>
      <p className="text-[#2a2a2a] text-xs">Choose from the sidebar on the left</p>
    </div>
  )
}

function RecordMp4Button({
  onRecord,
  disabled,
  isRecording,
  pct,
  compact = false,
}: {
  onRecord: () => void
  disabled?: boolean
  isRecording: boolean
  pct: number
  compact?: boolean
}) {
  const size = compact ? 'w-7 h-7' : 'w-8 h-8'
  return (
    <button
      onClick={onRecord}
      disabled={disabled || isRecording}
      title={isRecording ? `Recording MP4… ${pct}%` : 'Export replay as MP4'}
      data-track="studio_export_mp4"
      className={`${size} flex items-center justify-center bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg text-[#aaaaaa] hover:text-white disabled:opacity-30 transition-colors cursor-pointer relative`}
    >
      {isRecording ? (
        <span className="text-[9px] font-mono text-[#d4a017] tabular-nums">{pct}%</span>
      ) : (
        // Film / video-clip icon
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="3.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 6.5l4-2v7l-4-2v-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
