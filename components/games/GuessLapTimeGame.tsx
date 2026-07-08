'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Confetti } from '@/components/games/Confetti'
import { Leaderboard } from '@/components/games/Leaderboard'
import { fetchRaces, fetchCircuits, fetchDrivers, fetchTelemetry } from '@/lib/data'
import { formatMs } from '@/lib/games/formatScore'
import type { Race, Circuit, Driver, Telemetry } from '@/lib/types'

const ACCENT = '#e11d48'
const STATS_KEY = 'f1rs_games_guess_lap_time'
const TOTAL_ROUNDS = 5
// Slider bounds (seconds) — comfortably spans every F1 lap on the calendar.
const MIN_S = 55
const MAX_S = 135

// ── Time helpers ─────────────────────────────────────────────────────────────
function parseLapSec(s: string): number {
  const parts = s.split(':')
  return parts.length === 2 ? parseInt(parts[0]) * 60 + parseFloat(parts[1]) : parseFloat(s)
}
// m:ss.s — how lap times are conventionally written.
function fmtLap(sec: number): string {
  const m = Math.floor(sec / 60)
  const rem = sec - m * 60
  return `${m}:${rem.toFixed(1).padStart(4, '0')}`
}

// ── Stats (best total error, in ms) ──────────────────────────────────────────
interface Stats { best: number | null; gamesPlayed: number }
function loadStats(): Stats {
  if (typeof window === 'undefined') return { best: null, gamesPlayed: 0 }
  try { const r = localStorage.getItem(STATS_KEY); return r ? JSON.parse(r) : { best: null, gamesPlayed: 0 } }
  catch { return { best: null, gamesPlayed: 0 } }
}
function saveStats(s: Stats) {
  if (typeof window !== 'undefined') localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

function rating(totalMs: number) {
  const avg = totalMs / TOTAL_ROUNDS
  if (avg <= 300) return { label: 'Pace Master', color: '#d4a017', sub: 'Your internal clock is race-engineer accurate.' }
  if (avg <= 700) return { label: 'Sharp Read', color: '#c0c0c0', sub: 'You really know how these laps feel.' }
  if (avg <= 1500) return { label: 'Good Instinct', color: '#cd7f32', sub: 'Solid feel for the pace — keep watching.' }
  if (avg <= 3000) return { label: 'Getting There', color: '#888888', sub: 'A few more laps and you\'ll dial it in.' }
  return { label: 'Way Off Pace', color: '#666666', sub: 'Time to study some onboard laps.' }
}

// ── Animated lap trace (points map to a 500×420 space, fit undistorted) ───────
function LapTrace({ telemetry, drawKey }: { telemetry: Telemetry; drawKey: number }) {
  const { d, viewBox, sw, start } = useMemo(() => {
    const pts = telemetry.points
    const xs = pts.map((p) => p.x * 500), ys = pts.map((p) => p.y * 420)
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    const w = x1 - x0, h = y1 - y0, pad = Math.max(w, h) * 0.09
    return {
      d: pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x * 500).toFixed(1)} ${(p.y * 420).toFixed(1)}`).join(' '),
      viewBox: `${x0 - pad} ${y0 - pad} ${w + 2 * pad} ${h + 2 * pad}`,
      sw: Math.max(w, h) * 0.022,
      start: { x: xs[0], y: ys[0] },
    }
  }, [telemetry])
  return (
    <svg viewBox={viewBox} className="w-full max-h-52" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <motion.path key={drawKey} d={d} fill="none" stroke={ACCENT} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        pathLength={1} strokeDasharray={1} initial={{ strokeDashoffset: 1 }} animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: 'drop-shadow(0 0 8px rgba(225,29,72,0.35))' }} />
      <circle cx={start.x} cy={start.y} r={sw * 1.4} fill={ACCENT} />
    </svg>
  )
}

// ── Main game ────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'loading' | 'guessing' | 'revealed' | 'finished'

export function GuessLapTimeGame() {
  const { data: races = [] } = useQuery({ queryKey: ['races'], queryFn: fetchRaces })
  const { data: circuitsMap = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers })

  const circuitIds = useMemo(() => new Set((Object.values(circuitsMap) as Circuit[]).filter((c) => !c.variant).map((c) => c.id)), [circuitsMap])
  const driverName = useMemo(() => {
    const m: Record<string, string> = {}; for (const d of drivers as Driver[]) m[d.id] = d.name; return m
  }, [drivers])

  const [phase, setPhase] = useState<Phase>('idle')
  const [race, setRace] = useState<Race | null>(null)
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [guess, setGuess] = useState(90)
  const [drawKey, setDrawKey] = useState(0)
  const [roundNum, setRoundNum] = useState(1)
  const [totalErr, setTotalErr] = useState(0)
  const [lastErr, setLastErr] = useState(0)
  const [usedCircuits, setUsedCircuits] = useState<string[]>([])
  const [finalTotal, setFinalTotal] = useState(0)
  const [isBest, setIsBest] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)

  const gameRef = useRef<HTMLDivElement>(null)
  const loadId = useRef(0)

  const ready = races.length > 0 && circuitIds.size > 0

  const loadRound = useCallback(async (used: string[]) => {
    let pool = races.filter((r) => circuitIds.has(r.circuit) && !used.includes(r.circuit))
    if (pool.length === 0) pool = races.filter((r) => circuitIds.has(r.circuit))
    if (pool.length === 0) return
    const r = pool[Math.floor(Math.random() * pool.length)]
    const id = ++loadId.current
    setRace(r)
    setTelemetry(null)
    setGuess(90)
    setPhase('loading')
    try {
      const tel = await fetchTelemetry(r.telemetryFile)
      if (loadId.current !== id) return
      setTelemetry(tel)
      setDrawKey((k) => k + 1)
      setPhase('guessing')
    } catch {
      if (loadId.current !== id) return
      loadRound([...used, r.circuit]) // skip unparseable (NaN) telemetry
    }
  }, [races, circuitIds])

  const startGame = useCallback(() => {
    if (!ready) return
    const el = gameRef.current
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72), behavior: 'smooth' })
    setRoundNum(1); setTotalErr(0); setLastErr(0); setUsedCircuits([]); setFinalTotal(0); setIsBest(false)
    loadRound([])
  }, [ready, loadRound])

  const lockIn = useCallback(() => {
    if (phase !== 'guessing' || !race) return
    const actual = parseLapSec(race.lapTime)
    const err = Math.round(Math.abs(guess - actual) * 1000)
    setLastErr(err)
    setTotalErr((t) => t + err)
    setUsedCircuits((prev) => [...prev, race.circuit])
    setPhase('revealed')
  }, [phase, race, guess])

  const next = useCallback(() => {
    if (roundNum >= TOTAL_ROUNDS) {
      const total = totalErr
      const best = stats.best === null || total < stats.best
      const ns: Stats = { best: best ? total : stats.best, gamesPlayed: stats.gamesPlayed + 1 }
      setFinalTotal(total); setIsBest(best); setStats(ns); saveStats(ns); setPhase('finished')
    } else {
      setRoundNum((n) => n + 1)
      loadRound(usedCircuits)
    }
  }, [roundNum, totalErr, stats, usedCircuits, loadRound])

  if (!ready) {
    return (
      <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center">
        <p className="text-[#1a1712]/65 text-sm font-mono">Loading laps…</p>
      </div>
    )
  }

  const actualSec = race ? parseLapSec(race.lapTime) : 0

  return (
    <div ref={gameRef} className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5">
            <div className="text-5xl">⏲️</div>
            <p className="text-[#1a1712] text-sm leading-relaxed max-w-sm mx-auto">
              You&apos;re shown a real F1 lap — the circuit, driver and year.
              Slide to guess the <strong>lap time</strong>. The closer you are, the lower your score.
              {' '}{TOTAL_ROUNDS} laps, lowest total wins.
            </p>
            <button onClick={startGame}
              className="px-8 py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 hover:scale-105 active:scale-100"
              style={{ background: ACCENT }}>
              Start
            </button>
          </motion.div>
        )}

        {/* ── LOADING / GUESSING / REVEALED ── */}
        {(phase === 'loading' || phase === 'guessing' || phase === 'revealed') && race && (
          <motion.div key="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            <div className="flex items-center justify-between px-1">
              <p className="text-[#1a1712] text-xs font-mono uppercase tracking-widest">Guess the lap time</p>
              <span className="text-[#1a1712]/65 text-xs font-mono">{roundNum} / {TOTAL_ROUNDS}</span>
            </div>
            <div className="h-0.5 bg-[#ece6d9] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: ACCENT }}
                initial={{ width: `${((roundNum - 1) / TOTAL_ROUNDS) * 100}%` }}
                animate={{ width: `${(roundNum / TOTAL_ROUNDS) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">
              {/* Left: lap trace + context */}
              <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-5 flex flex-col items-center justify-center" style={{ minHeight: 280 }}>
                {telemetry ? <LapTrace telemetry={telemetry} drawKey={drawKey} /> : <p className="text-[#1a1712]/50 text-sm font-mono">Drawing lap…</p>}
                <p className="text-[#1a1712] text-sm font-semibold mt-3">{race.circuitName}</p>
                <p className="text-[#1a1712]/60 text-xs font-mono mt-0.5">{driverName[race.driverId] ?? ''} · {race.year}</p>
              </div>

              {/* Right: slider / reveal */}
              <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-5 flex flex-col justify-center">
                {phase !== 'revealed' ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest mb-1">Your guess</p>
                      <p className="text-5xl font-bold font-mono tabular-nums" style={{ color: ACCENT }}>{fmtLap(guess)}</p>
                    </div>
                    <input type="range" min={MIN_S} max={MAX_S} step={0.1} value={guess}
                      onChange={(e) => setGuess(parseFloat(e.target.value))}
                      disabled={phase === 'loading'}
                      className="w-full cursor-pointer" style={{ accentColor: ACCENT }} />
                    <div className="flex justify-between text-[10px] font-mono text-[#1a1712]/45">
                      <span>{fmtLap(MIN_S)}</span><span>{fmtLap(MAX_S)}</span>
                    </div>
                    <button onClick={lockIn} disabled={phase === 'loading'}
                      className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                      style={{ background: ACCENT }}>
                      Lock It In
                    </button>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
                    <div>
                      <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest mb-1">Actual lap time</p>
                      <p className="text-4xl font-bold font-mono tabular-nums text-[#1a1712]">{fmtLap(actualSec)}</p>
                    </div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest">You</p>
                        <p className="font-mono text-[#1a1712]">{fmtLap(guess)}</p>
                      </div>
                      <div>
                        <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest">Off by</p>
                        <p className="font-mono font-bold" style={{ color: ACCENT }}>{formatMs(lastErr)}</p>
                      </div>
                    </div>
                    <p className="text-[#1a1712]/55 text-xs font-mono">Total off: {formatMs(totalErr)}</p>
                    <button onClick={next}
                      className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{ background: ACCENT }}>
                      {roundNum >= TOTAL_ROUNDS ? 'See Results' : 'Next Lap'}
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FINISHED ── */}
        {phase === 'finished' && (() => {
          const rt = rating(finalTotal)
          return (
            <motion.div key="finished" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5">
              {isBest && <Confetti />}
              {isBest && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest"
                  style={{ color: ACCENT, background: `${ACCENT}1a`, border: `1px solid ${ACCENT}50` }}>
                  ★ New Personal Best
                </motion.div>
              )}
              <div>
                <p className="text-[#1a1712]/65 text-xs font-mono uppercase tracking-widest mb-3">Total Off ({TOTAL_ROUNDS} laps)</p>
                <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.08 }}
                  className="text-6xl font-bold font-mono" style={{ color: rt.color }}>
                  {formatMs(finalTotal)}
                </motion.p>
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: rt.color }}>{rt.label}</p>
                <p className="text-[#1a1712] text-sm mt-1">{rt.sub}</p>
              </div>
              <div className="flex flex-col gap-3">
                <ShareButtons
                  text={`⏲️ Guess the Lap Time\n${TOTAL_ROUNDS} laps, only ${formatMs(finalTotal)} off — ${rt.label}\nf1racesignature.site/games/guess-the-lap-time`}
                  url="https://f1racesignature.site/games/guess-the-lap-time"
                />
                <button onClick={startGame}
                  className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 hover:scale-[1.02] active:scale-100"
                  style={{ background: ACCENT }}>
                  Play Again
                </button>
                <Leaderboard gameId="guess-the-lap-time" score={finalTotal} ascending suffix="ms" accent={ACCENT} />
                <NextGameCard currentId="guess-the-lap-time" />
              </div>
            </motion.div>
          )
        })()}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.gamesPlayed > 0 && phase !== 'finished' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
            <p className="text-[#1a1712] text-base font-mono font-bold">{stats.best !== null ? formatMs(stats.best) : '—'}</p>
            <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Best (total off)</p>
          </div>
          <div className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
            <p className="text-[#1a1712] text-base font-mono font-bold">{stats.gamesPlayed}</p>
            <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Games</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
