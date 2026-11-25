'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import {
  DEFAULT_DESIGN, PRESETS, ZONE_LABELS, FINISHES, PATTERNS,
  getLiveries, saveLivery, removeLivery, sanitizeMarking,
  type LiveryDesign, type SavedLivery, type Finish, type Pattern, type LiveryColors,
} from '@/lib/games/livery'

const ACCENT = '#e0115f'
const SITE = 'https://f1racesignature.site'

// 3D scene is client-only (WebGL); skip SSR entirely.
const Scene = dynamic(() => import('@/components/games/livery/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center text-[#6b6358] text-sm font-mono">
      Loading 3D garage…
    </div>
  ),
})

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}

export function LiveryDesignerGame() {
  const [design, setDesign] = useState<LiveryDesign>(DEFAULT_DESIGN)
  const [autoRotate, setAutoRotate] = useState(true)
  const [garage, setGarage] = useState<SavedLivery[]>([])
  const [justSaved, setJustSaved] = useState(false)
  const captureRef = useRef<(() => string) | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [canFullscreen, setCanFullscreen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Element fullscreen isn't available everywhere (e.g. iPhone Safari): only
  // offer the button where it works, and mirror the real fullscreen state.
  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled))
    const onChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void stageRef.current?.requestFullscreen()
  }

  // Load saved designs after mount (localStorage is client-only).
  useEffect(() => {
    const sync = () => setGarage(getLiveries())
    sync()
    window.addEventListener('livery-garage-changed', sync)
    return () => window.removeEventListener('livery-garage-changed', sync)
  }, [])

  const setColor = useCallback((key: keyof LiveryColors, value: string) => {
    setDesign((d) => ({ ...d, colors: { ...d.colors, [key]: value } }))
  }, [])

  function downscale(dataUrl: string, size: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        const ratio = img.width / img.height
        c.width = size
        c.height = Math.round(size / ratio)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })
  }

  async function handleSave() {
    let thumb: string | undefined
    try {
      const full = captureRef.current?.()
      if (full) thumb = await downscale(full, 240)
    } catch { /* capture is best-effort */ }
    saveLivery(design, thumb)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1800)
  }

  function handleDownload() {
    const url = captureRef.current?.()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `f1-livery-${design.name || 'design'}-${design.number || ''}.png`.replace(/\s+/g, '-').toLowerCase()
    a.click()
  }

  function handleRandomize() {
    const c: LiveryColors = {
      body: randomHex(), nose: randomHex(), wings: randomHex(),
      sidepods: randomHex(), halo: randomHex(), rims: randomHex(), accent: randomHex(),
    }
    const finishes: Finish[] = ['gloss', 'matte', 'metallic']
    // Weight "none" so solid liveries still show up regularly.
    const patterns: Pattern[] = ['none', 'none', ...PATTERNS.map((p) => p.key)]
    setDesign((d) => ({
      ...d,
      colors: c,
      finish: finishes[Math.floor(Math.random() * finishes.length)],
      pattern: patterns[Math.floor(Math.random() * patterns.length)],
    }))
  }

  const shareText = `I just designed my own F1 car${design.name ? ` — "${design.name}" #${design.number}` : ''} in the 3D Livery Designer 🏎️🎨 Build yours:`

  // ── Shared styles ──
  const stageBtn =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1712]/80 text-white hover:bg-[#1a1712] transition-colors cursor-pointer backdrop-blur'
  const segBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
      active
        ? 'text-white border-transparent'
        : 'text-[#1a1712] border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3]'
    }`

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] gap-5 lg:gap-6 items-start">
      {/* ── 3D studio stage — pinned on desktop while the controls scroll ── */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-[72px]">
        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-2xl border border-[#dcd5c6] h-[62vh] min-h-[360px] lg:h-[calc(100dvh-200px)] lg:min-h-[540px] [&:fullscreen]:h-screen [&:fullscreen]:rounded-none [&:fullscreen]:border-0"
          style={{ background: '#e8e2d5' }}
        >
          <Scene design={design} autoRotate={autoRotate} captureRef={captureRef} />

          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => setAutoRotate((v) => !v)} className={stageBtn}>
              {autoRotate ? <IconPause /> : <IconRotate />}
              {autoRotate ? 'Stop spin' : 'Auto-spin'}
            </button>
            {canFullscreen && (
              <button onClick={toggleFullscreen} className={stageBtn} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                {isFullscreen ? <IconCollapse /> : <IconExpand />}
                <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>
            )}
          </div>

          {/* Livery plate: what you're building, studio-caption style */}
          <div className="absolute top-3 left-3 rounded-lg bg-[#fbf9f4]/85 backdrop-blur px-3 py-2 border border-[#dcd5c6]">
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#6b6358]">Livery</p>
            <p className="text-sm font-semibold text-[#1a1712] leading-tight">
              {design.name || 'Unnamed'} <span className="font-mono" style={{ color: ACCENT }}>#{design.number || '0'}</span>
            </p>
          </div>

          <p className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-[#1a1712]/55">
            Drag to orbit · scroll to zoom
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={handleSave} className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95 cursor-pointer" style={{ background: ACCENT }}>
            {justSaved ? <IconCheck /> : <IconHeart />}{justSaved ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleDownload} className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3] text-[#1a1712] transition-all active:scale-95 cursor-pointer">
            <IconDownload />PNG
          </button>
          <button onClick={handleRandomize} className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3] text-[#1a1712] transition-all active:scale-95 cursor-pointer">
            <IconShuffle />Surprise
          </button>
          <button onClick={() => setDesign(DEFAULT_DESIGN)} className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3] text-[#1a1712] transition-all active:scale-95 cursor-pointer">
            <IconReset />Reset
          </button>
        </div>
        {/* CC BY 4.0 attribution for the 3D car model */}
        <p className="text-[10px] text-[#6b6358] leading-snug">
          3D model:{' '}
          <a href="https://sketchfab.com/3d-models/formula-1-2022-car-65dcd974798f4f03be5cdf4f79e228d8" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1a1712]">
            &ldquo;Formula 1 2022 Car&rdquo;
          </a>{' '}
          by{' '}
          <a href="https://sketchfab.com/luis.adrian.villagrana" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1a1712]">
            luis.adrian.villagrana
          </a>
          , licensed{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1a1712]">
            CC BY 4.0
          </a>
          ; paint zones adapted.
        </p>
      </div>

      {/* ── Control panel ── */}
      <div className="space-y-5">
        {/* Presets */}
        <section>
          <p className="text-[#6b6358] text-[10px] font-mono uppercase tracking-widest mb-2">Team-inspired presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setDesign(p.design)}
                className="group flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-[#dcd5c6] bg-[#fbf9f4] hover:border-[#c4bca8] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full border border-white/60" style={{ background: p.design.colors.body }} />
                  <span className="w-4 h-4 rounded-full border border-white/60" style={{ background: p.design.colors.accent }} />
                </span>
                <span className="text-xs font-medium text-[#1a1712]">{p.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Zone colours */}
        <section>
          <p className="text-[#6b6358] text-[10px] font-mono uppercase tracking-widest mb-2">Paint zones</p>
          <div className="grid grid-cols-2 gap-2">
            {ZONE_LABELS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] px-2.5 py-2 cursor-pointer hover:border-[#c4bca8] transition-colors">
                <span
                  className="relative w-7 h-7 rounded-lg border border-black/10 shrink-0 overflow-hidden"
                  style={{ background: design.colors[key] }}
                >
                  <input
                    type="color"
                    value={design.colors[key]}
                    onChange={(e) => setColor(key, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label={`${label} colour`}
                  />
                </span>
                <span className="text-xs font-medium text-[#1a1712] leading-tight">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Finish + pattern */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section>
            <p className="text-[#6b6358] text-[10px] font-mono uppercase tracking-widest mb-2">Finish</p>
            <div className="flex flex-wrap gap-1.5">
              {FINISHES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDesign((d) => ({ ...d, finish: f.key }))}
                  className={segBtn(design.finish === f.key)}
                  style={design.finish === f.key ? { background: ACCENT } : undefined}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <p className="text-[#6b6358] text-[10px] font-mono uppercase tracking-widest mb-2">Pattern</p>
            <div className="flex flex-wrap gap-1.5">
              {PATTERNS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setDesign((d) => ({ ...d, pattern: p.key }))}
                  className={segBtn(design.pattern === p.key)}
                  style={design.pattern === p.key ? { background: ACCENT } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Number + name */}
        <section className="grid grid-cols-[80px_1fr] gap-3">
          <div>
            <p className="text-[#6b6358] text-[10px] font-mono uppercase tracking-widest mb-2">Number</p>
            <input
              value={design.number}
              onChange={(e) => setDesign((d) => ({ ...d, number: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
              inputMode="numeric"
              placeholder="16"
              className="w-full rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] px-3 py-2.5 text-[#1a1712] text-sm font-mono text-center focus:outline-none focus:border-[#c4bca8]"
            />
          </div>
          <div>
            <p className="text-[#6b6358] text-[10px] font-mono uppercase tracking-widest mb-2">Name / initials</p>
            <input
              value={design.name}
              onChange={(e) => setDesign((d) => ({ ...d, name: sanitizeMarking(e.target.value, 8) }))}
              placeholder="YOU"
              className="w-full rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] px-3 py-2.5 text-[#1a1712] text-sm font-mono uppercase focus:outline-none focus:border-[#c4bca8]"
            />
          </div>
        </section>

        {/* Share */}
        <ShareButtons text={shareText} url={`${SITE}/games/livery-designer`} />
      </div>

      {/* ── Saved garage ── */}
      {garage.length > 0 && (
        <div className="lg:col-span-2">
          <p className="text-[#6b6358] text-[10px] font-mono uppercase tracking-widest mb-2">Your garage</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {garage.map((l) => (
              <div key={l.id} className="group relative shrink-0 w-32 rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] overflow-hidden">
                <button onClick={() => setDesign(l.design)} className="block w-full cursor-pointer" title="Load this design">
                  {l.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.thumb} alt="Saved livery" className="w-full h-20 object-cover" />
                  ) : (
                    <div className="w-full h-20 grid place-items-center" style={{ background: l.design.colors.body }}>
                      <span className="text-white font-mono text-lg drop-shadow">#{l.design.number}</span>
                    </div>
                  )}
                  <div className="px-2 py-1.5 text-left">
                    <p className="text-[11px] font-medium text-[#1a1712] truncate">{l.design.name || 'Unnamed'} #{l.design.number}</p>
                    <p className="text-[10px] text-[#6b6358] capitalize">{l.design.finish} · {l.design.pattern}</p>
                  </div>
                </button>
                <button
                  onClick={() => removeLivery(l.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#1a1712]/70 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next game */}
      <div className="lg:col-span-2">
        <NextGameCard currentId="livery-designer" />
      </div>
    </div>
  )
}

// ── Toolbar icons (line style, matches the site's game icon set) ──────────────
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}
const IconPause = () => <Svg><path d="M9 5v14M15 5v14" /></Svg>
const IconRotate = () => <Svg><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 3.5V7h-3.5" /></Svg>
const IconExpand = () => <Svg><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Svg>
const IconCollapse = () => <Svg><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></Svg>
const IconHeart = () => <Svg><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></Svg>
const IconCheck = () => <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
const IconDownload = () => <Svg><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></Svg>
const IconShuffle = () => <Svg><path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.6 0 2.7-1.6 3.6-3.5M14 7.5c.7-.3 1.5-.5 2.5-.5H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5" /></Svg>
const IconReset = () => <Svg><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 3.5V7h3.5" /></Svg>
