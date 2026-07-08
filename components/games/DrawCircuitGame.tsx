'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Confetti } from '@/components/games/Confetti'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Leaderboard } from '@/components/games/Leaderboard'
import { fetchCircuits, fetchRaces } from '@/lib/data'
import type { Circuit } from '@/lib/types'

const ACCENT = '#ec4899'
const STATS_KEY = 'f1rs_games_draw_circuit'
const VB_W = 500
const VB_H = 420
const TARGET_SAMPLES = 120
const MIN_POINTS = 12

// ── Short, friendly circuit labels ──────────────────────────────────────────────
const SHORT_NAMES: Record<string, string> = {
  monaco: 'Monaco', silverstone: 'Silverstone', spa: 'Spa-Francorchamps', bahrain: 'Bahrain',
  abu_dhabi: 'Abu Dhabi', suzuka: 'Suzuka', interlagos: 'Interlagos', monza: 'Monza',
  hungaroring: 'Hungaroring', miami: 'Miami', marina_bay: 'Singapore', baku: 'Baku',
  barcelona: 'Barcelona', red_bull_ring: 'Red Bull Ring', sochi: 'Sochi', sepang: 'Sepang',
  las_vegas: 'Las Vegas', jeddah: 'Jeddah', canada: 'Montréal', zandvoort: 'Zandvoort',
  cota: 'Austin (COTA)', mexico: 'Mexico City', imola: 'Imola', australia: 'Melbourne',
}
function shortName(c: Circuit): string {
  return SHORT_NAMES[c.id] ?? c.name
}

// ── Difficulty hints per circuit (purely flavour text) ──────────────────────────
function difficultyLabel(corners: number): { label: string; color: string } {
  if (corners <= 12) return { label: 'Easier', color: '#22c55e' }
  if (corners <= 17) return { label: 'Tricky', color: '#f59e0b' }
  return { label: 'Brutal', color: '#ef4444' }
}

// ── Geometry helpers ────────────────────────────────────────────────────────────
interface Pt { x: number; y: number }

function normalize(pts: Pt[]): Pt[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  const w = maxX - minX || 1
  const h = maxY - minY || 1
  const scale = 1 / Math.max(w, h)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return pts.map(p => ({ x: (p.x - cx) * scale, y: (p.y - cy) * scale }))
}

/** Resample a polyline to n points evenly spaced by arc length (fair comparison). */
function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length < 2) return pts
  const seg: number[] = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    seg.push(d); total += d
  }
  if (total === 0) return pts
  const step = total / (n - 1)
  const out: Pt[] = [pts[0]]
  let acc = 0, si = 0
  for (let i = 1; i < n; i++) {
    const target = i * step
    while (si < seg.length && acc + seg[si] < target) { acc += seg[si]; si++ }
    if (si >= seg.length) { out.push(pts[pts.length - 1]); continue }
    const t = (target - acc) / seg[si]
    out.push({ x: pts[si].x + (pts[si + 1].x - pts[si].x) * t, y: pts[si].y + (pts[si + 1].y - pts[si].y) * t })
  }
  return out
}

/** RMS of nearest-neighbour distances from a → b (penalises large deviations). */
function rmsMinDist(a: Pt[], b: Pt[]): number {
  let sum = 0
  for (const p of a) {
    let best = Infinity
    for (const q of b) {
      const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2
      if (d < best) best = d
    }
    sum += best
  }
  return Math.sqrt(sum / a.length)
}

/** Symmetric RMS chamfer distance between two normalised point clouds (lower = closer). */
function chamfer(a: Pt[], b: Pt[]): number {
  return (rmsMinDist(a, b) + rmsMinDist(b, a)) / 2
}

function scoreDrawing(user: Pt[], target: Pt[]): number {
  if (user.length < 2 || target.length < 2) return 0
  const u = normalize(resample(user, 100))
  const t = normalize(resample(target, 100))
  const d = chamfer(u, t)
  // ~0 = perfect overlay; ~0.16+ = unrecognisable shape.
  return Math.max(0, Math.min(100, Math.round(100 * (1 - d / 0.16))))
}

interface Rating { label: string; color: string; lines: string[] }

function getRating(score: number): Rating {
  if (score >= 80) return {
    label: 'Adrian Newey', color: ACCENT,
    lines: [
      'Adrian Newey wants his pencil back. Genuinely immaculate.',
      "Pixel-perfect. Red Bull's design office is on the phone.",
      "That's a championship-winning lap. Simply lovely.",
      'You clearly have a wind tunnel in the garage.',
    ],
  }
  if (score >= 62) return {
    label: 'Pole Lap', color: '#22c55e',
    lines: [
      'Purple sector! Crofty is losing his mind in commentary.',
      'GET IN THERE! That is a seriously clean lap.',
      'Front-row stuff — you know this circuit by heart.',
      "Hammer time. That'll do nicely.",
    ],
  }
  if (score >= 42) return {
    label: 'On the Podium', color: '#84cc16',
    lines: [
      "P3 — but you'll happily spray the champagne.",
      'A proper "smooth operator" lap. Solid points.',
      'Brundle nods approvingly on the gridwalk.',
      'Clearly recognisable. Plan B worked out.',
    ],
  }
  if (score >= 22) return {
    label: 'Points Finish', color: '#f59e0b',
    lines: [
      'The shape is… there-ish. Bono, my eyes are gone.',
      'We are checking. We are checking.',
      'P10 and a point for effort. We move.',
      "It's giving 'first lap in the wet'.",
    ],
  }
  return {
    label: 'Gravel Trap', color: '#ef4444',
    lines: [
      "Into the gravel — that's a Maldonado special.",
      'IS THAT GLOCK?! …no, no it is not.',
      'Grosjean called, he wants his racing line back.',
      "Leave me alone, I know what I'm doing. (You did not.)",
      'Beached it at Turn 1. Bring out the crane.',
    ],
  }
}

function pickLine(r: Rating): string {
  return r.lines[Math.floor(Math.random() * r.lines.length)]
}

// ── Stats ───────────────────────────────────────────────────────────────────────
interface Stats { bestScore: number; gamesPlayed: number; totalScore: number }
function loadStats(): Stats {
  if (typeof window === 'undefined') return { bestScore: 0, gamesPlayed: 0, totalScore: 0 }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { bestScore: 0, gamesPlayed: 0, totalScore: 0 }
  } catch { return { bestScore: 0, gamesPlayed: 0, totalScore: 0 } }
}
function saveStats(s: Stats) {
  if (typeof window !== 'undefined') localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

// ── Main component ──────────────────────────────────────────────────────────────
type Phase = 'idle' | 'drawing' | 'result'

export function DrawCircuitGame() {
  const { data: circuitsMap = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })
  // Exclude historic-layout variants (e.g. old Yas Marina) — they'd duplicate a track.
  const circuits = (Object.values(circuitsMap) as Circuit[]).filter((c) => !c.variant)
  const { data: races = [] } = useQuery({ queryKey: ['races'], queryFn: fetchRaces })

  const [phase, setPhase] = useState<Phase>('idle')
  const [circuit, setCircuit] = useState<Circuit | null>(null)
  const [points, setPoints] = useState<Pt[]>([])
  const [score, setScore] = useState(0)
  const [flavor, setFlavor] = useState('')
  const [isNewBest, setIsNewBest] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)

  const surfaceRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<SVGPathElement>(null)
  const drawingRef = useRef(false)
  const lastPtRef = useRef<Pt | null>(null)
  const lastIdRef = useRef<string | null>(null)
  const gameRef = useRef<HTMLDivElement>(null)

  const pickCircuit = useCallback((): Circuit | null => {
    if (circuits.length === 0) return null
    let next = circuits[Math.floor(Math.random() * circuits.length)]
    if (circuits.length > 1) {
      let guard = 0
      while (next.id === lastIdRef.current && guard++ < 10) {
        next = circuits[Math.floor(Math.random() * circuits.length)]
      }
    }
    lastIdRef.current = next.id
    return next
  }, [circuits])

  const startRound = useCallback(() => {
    const c = pickCircuit()
    if (!c) return
    const el = gameRef.current
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    setCircuit(c)
    setPoints([])
    setScore(0)
    setIsNewBest(false)
    lastPtRef.current = null
    setPhase('drawing')
  }, [pickCircuit])

  function toSvgPoint(e: React.PointerEvent): Pt {
    const el = surfaceRef.current!
    const rect = el.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * VB_W,
      y: ((e.clientY - rect.top) / rect.height) * VB_H,
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (phase !== 'drawing') return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drawingRef.current = true
    const p = toSvgPoint(e)
    lastPtRef.current = p
    setPoints([p])
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drawingRef.current || phase !== 'drawing') return
    const p = toSvgPoint(e)
    const last = lastPtRef.current
    // Throttle by distance to keep the point list lean.
    if (last && (p.x - last.x) ** 2 + (p.y - last.y) ** 2 < 9) return
    lastPtRef.current = p
    setPoints(prev => [...prev, p])
  }

  function handlePointerUp() {
    drawingRef.current = false
  }

  function clearDrawing() {
    setPoints([])
    lastPtRef.current = null
  }

  function submitDrawing() {
    if (!circuit || points.length < MIN_POINTS) return
    // Sample the real circuit path via a hidden measuring element.
    const pathEl = measureRef.current
    const target: Pt[] = []
    if (pathEl) {
      const len = pathEl.getTotalLength()
      for (let i = 0; i <= TARGET_SAMPLES; i++) {
        const pt = pathEl.getPointAtLength((len * i) / TARGET_SAMPLES)
        target.push({ x: pt.x, y: pt.y })
      }
    }
    const s = scoreDrawing(points, target)
    setFlavor(pickLine(getRating(s)))
    const newBest = s > stats.bestScore
    const newStats: Stats = {
      bestScore: Math.max(stats.bestScore, s),
      gamesPlayed: stats.gamesPlayed + 1,
      totalScore: stats.totalScore + s,
    }
    setScore(s)
    setIsNewBest(newBest)
    setStats(newStats)
    saveStats(newStats)
    setPhase('result')
  }

  const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const avg = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0

  // Hidden measuring path — always rendered so getPointAtLength is available on submit.
  const measureSvg = circuit && (
    <svg viewBox={circuit.viewBox} width="0" height="0" style={{ position: 'absolute', visibility: 'hidden' }} aria-hidden>
      <path ref={measureRef} d={circuit.path} />
    </svg>
  )

  if (circuits.length === 0) {
    return (
      <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center">
        <p className="text-[#1a1712]/65 text-sm font-mono">Loading circuits…</p>
      </div>
    )
  }

  return (
    <div ref={gameRef} className="space-y-4">
      {measureSvg}
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5"
          >
            <div className="flex items-center justify-center gap-5 opacity-25">
              {circuits.slice(0, 3).map(c => (
                <svg key={c.id} viewBox={c.viewBox} className="h-16 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d={c.path} fill="none" stroke="#16120c" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
            <p className="text-[#1a1712] text-sm leading-relaxed max-w-sm mx-auto">
              You&apos;ll be given a circuit name. Draw its outline from memory in one stroke —
              then we score how close you got to the real thing.
            </p>
            <button onClick={startRound}
              className="px-8 py-3 text-black font-semibold rounded-xl transition-all hover:brightness-105 hover:scale-105 active:scale-100 cursor-pointer"
              style={{ background: ACCENT }}
            >
              Start Drawing
            </button>
          </motion.div>
        )}

        {/* ── DRAWING ── */}
        {phase === 'drawing' && circuit && (
          <motion.div key="drawing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Prompt */}
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: ACCENT }}>Draw this circuit</p>
                <h3 className="text-2xl text-[#1a1712] leading-none font-display">
                  {shortName(circuit)}
                </h3>
              </div>
              {(() => { const d = difficultyLabel(circuit.corners); return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold"
                  style={{ color: d.color, background: `${d.color}14`, border: `1px solid ${d.color}33` }}>
                  {d.label} · {circuit.corners} corners
                </span>
              )})()}
            </div>

            {/* Canvas — pointer/touch handling lives on the div (WebKit handles
                touch-action reliably on a div, not on an inline <svg>). */}
            <div
              ref={surfaceRef}
              className="relative rounded-2xl border bg-[#fbf9f4] overflow-hidden cursor-crosshair select-none"
              style={{ borderColor: '#dcd5c6', aspectRatio: `${VB_W} / ${VB_H}`, touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Dot grid */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }} />
              {/* Drawing (visual only — does not receive pointer events) */}
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                {points.length > 1 && (
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
              {points.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-[#1a1712]/35 text-sm font-mono">Drag to draw the outline</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={clearDrawing}
                className="py-3 rounded-xl border border-[#dcd5c6] text-[#1a1712]/70 text-sm font-medium hover:text-[#1a1712] hover:border-[#c4bca8] transition-all"
              >
                Clear
              </button>
              <button onClick={submitDrawing} disabled={points.length < MIN_POINTS}
                className="py-3 rounded-xl text-black font-semibold transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: ACCENT }}
              >
                Done — Score It
              </button>
            </div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && circuit && (() => {
          const rating = getRating(score)
          const studioRace = races.find(r => r.circuit === circuit.id)
          const studioHref = studioRace ? `/studio?race=${studioRace.id}` : '/studio'
          return (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-6 md:p-8 space-y-6"
            >
              {isNewBest && <Confetti />}
              {isNewBest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="flex justify-center"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest"
                    style={{ color: ACCENT, background: `${ACCENT}1a`, border: `1px solid ${ACCENT}4d` }}>
                    ★ New Personal Best
                  </span>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Overlay comparison */}
                <div className="rounded-2xl border border-[#e2dccd] bg-[#f4f1ea] p-4">
                  <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest mb-2 text-center">
                    Yours vs the real {shortName(circuit)}
                  </p>
                  <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
                    <path d={circuit.path} fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 9" opacity="0.85" />
                    {points.length > 1 && (
                      <polyline points={polyline} fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                    )}
                  </svg>
                  <div className="flex items-center justify-center gap-5 mt-2 text-[10px] font-mono">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block" style={{ background: ACCENT }} /> You</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block" style={{ background: '#22c55e' }} /> Real</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center space-y-2">
                  <p className="text-[#1a1712]/55 text-xs font-mono uppercase tracking-widest">Accuracy</p>
                  <div>
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.08 }}
                      className="text-6xl font-bold font-mono" style={{ color: rating.color }}
                    >
                      {score}
                    </motion.span>
                    <span className="text-2xl text-[#1a1712]/55 font-mono">%</span>
                  </div>
                  <p className="text-lg font-semibold" style={{ color: rating.color }}>{rating.label}</p>
                  <p className="text-[#1a1712]/70 text-sm">{flavor}</p>
                </div>
              </div>

              {/* Global leaderboard (renders only once Supabase is configured) */}
              <Leaderboard gameId="draw-the-circuit" score={score} suffix="%" accent={ACCENT} meta={{ circuit: circuit.id }} />

              {/* Studio bridge */}
              <Link
                href={studioHref}
                className="group relative flex items-center gap-4 rounded-2xl border p-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: 'rgba(212,160,23,0.4)', background: 'rgba(212,160,23,0.06)' }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 70% 60% at 0% 50%, rgba(212,160,23,0.14) 0%, transparent 65%)' }}
                />
                <span
                  className="relative inline-flex items-center justify-center w-11 h-11 rounded-xl text-2xl shrink-0"
                  style={{ background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)' }}
                >
                  🖼️
                </span>
                <div className="relative min-w-0 flex-1">
                  <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest font-semibold mb-0.5">
                    See the real thing
                  </p>
                  <p className="text-[#1a1712] text-sm leading-snug">
                    Open <span className="font-semibold">{shortName(circuit)}</span> in the Studio and turn its data into framed art.
                  </p>
                </div>
                <span className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-[#d4a017] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                  Open
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>

              <div className="flex flex-col gap-3">
                <ShareButtons
                  text={`🏎️ Draw the Circuit — ${shortName(circuit)}\n✏️ ${score}% accuracy — ${rating.label}\nf1racesignature.site/games/draw-the-circuit`}
                  url="https://f1racesignature.site/games/draw-the-circuit"
                />
                <button onClick={startRound}
                  className="w-full px-6 py-3 text-black font-semibold rounded-xl transition-all hover:brightness-105 hover:scale-[1.02] active:scale-100 cursor-pointer"
                  style={{ background: ACCENT }}
                >
                  Next Circuit
                </button>
                <NextGameCard currentId="draw-the-circuit" />
              </div>
            </motion.div>
          )
        })()}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.gamesPlayed > 0 && phase !== 'result' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Best', value: `${stats.bestScore}%` },
            { label: 'Average', value: `${avg}%` },
            { label: 'Drawn', value: String(stats.gamesPlayed) },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
              <p className="text-[#1a1712] text-base font-mono font-bold">{s.value}</p>
              <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
