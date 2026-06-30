'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const segBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
      active
        ? 'text-white border-transparent'
        : 'text-[#1a1712] border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3]'
    }`

  return (
    <div className="grid lg:grid-cols-[1.15fr_1fr] gap-5">
      {/* ── 3D viewport ── */}
      <div className="flex flex-col gap-3">
        <div
          className="relative rounded-2xl overflow-hidden border border-[#dcd5c6]"
          style={{ height: 'clamp(340px, 52vh, 520px)', background: '#e9e4d7' }}
        >
          <Scene design={design} autoRotate={autoRotate} captureRef={captureRef} />
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1712]/80 text-white hover:bg-[#1a1712] transition-colors cursor-pointer backdrop-blur"
          >
            {autoRotate ? '⏸ Stop spin' : '↻ Auto-spin'}
          </button>
          <p className="absolute bottom-3 left-3 text-[10px] font-mono uppercase tracking-widest text-[#1a1712]/50">
            Drag to orbit · scroll to zoom
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={handleSave} className="py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95 cursor-pointer" style={{ background: ACCENT }}>
            {justSaved ? '✓ Saved' : '♥ Save'}
          </button>
          <button onClick={handleDownload} className="py-2.5 rounded-xl text-sm font-medium border border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3] text-[#1a1712] transition-all active:scale-95 cursor-pointer">
            ↓ PNG
          </button>
          <button onClick={handleRandomize} className="py-2.5 rounded-xl text-sm font-medium border border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3] text-[#1a1712] transition-all active:scale-95 cursor-pointer">
            🎲 Surprise
          </button>
          <button onClick={() => setDesign(DEFAULT_DESIGN)} className="py-2.5 rounded-xl text-sm font-medium border border-[#dcd5c6] bg-[#f3eee3] hover:bg-[#e9e2d3] text-[#1a1712] transition-all active:scale-95 cursor-pointer">
            ↺ Reset
          </button>
        </div>
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
