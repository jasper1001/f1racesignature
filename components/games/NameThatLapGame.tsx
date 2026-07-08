'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ShareButtons } from '@/components/games/ShareButtons'
import { Confetti } from '@/components/games/Confetti'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Leaderboard } from '@/components/games/Leaderboard'
import { fetchRaces, fetchCircuits, fetchDrivers, fetchTelemetry } from '@/lib/data'
import type { Race, Circuit, Driver, Telemetry } from '@/lib/types'

const ACCENT = '#8b5cf6'
const STATS_KEY = 'f1rs_games_name_that_lap'
const TOTAL_ROUNDS = 10

// ── Stats ───────────────────────────────────────────────────────────────────
interface Stats { bestScore: number; totalCorrect: number; gamesPlayed: number }
function loadStats(): Stats {
  if (typeof window === 'undefined') return { bestScore: 0, totalCorrect: 0, gamesPlayed: 0 }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { bestScore: 0, totalCorrect: 0, gamesPlayed: 0 }
  } catch { return { bestScore: 0, totalCorrect: 0, gamesPlayed: 0 } }
}
function saveStats(s: Stats) {
  if (typeof window !== 'undefined') localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getGameRating(score: number) {
  if (score === 10) return { label: 'Telemetry Savant', color: '#d4a017', sub: 'You read a racing line like a race engineer.' }
  if (score >= 8)  return { label: 'Data Analyst',     color: '#c0c0c0', sub: 'You know these circuits by their shape alone.' }
  if (score >= 6)  return { label: 'Trackside Spotter', color: '#cd7f32', sub: 'Solid eye for a layout — keep studying the maps.' }
  if (score >= 4)  return { label: 'Getting There',     color: '#888888', sub: 'A few more laps and the lines will click.' }
  return           { label: 'Rookie Engineer',          color: '#666666', sub: 'Time to study some onboard laps.' }
}

interface Option { id: string; name: string }
interface Round { race: Race; options: Option[] }

// Build a round: a random race on an unused circuit + three wrong circuit options.
function makeRound(races: Race[], circuits: Circuit[], usedCircuits: string[]): Round | null {
  const byId = new Set(circuits.map((c) => c.id))
  let pool = races.filter((r) => byId.has(r.circuit) && !usedCircuits.includes(r.circuit))
  if (pool.length === 0) pool = races.filter((r) => byId.has(r.circuit))
  if (pool.length === 0) return null
  const race = pool[Math.floor(Math.random() * pool.length)]
  const distractors = shuffle(circuits.filter((c) => c.id !== race.circuit)).slice(0, 3)
  const options = shuffle<Option>([
    { id: race.circuit, name: race.circuitName },
    ...distractors.map((c) => ({ id: c.id, name: c.name })),
  ])
  return { race, options }
}

// ── Animated lap trace ───────────────────────────────────────────────────────
// The telemetry points map to a 500×420 space (as the studio renders them); we
// fit that to the SVG with preserveAspectRatio so the shape is never distorted.
function LapTrace({ telemetry, drawKey, revealed }: { telemetry: Telemetry; drawKey: number; revealed: boolean }) {
  const { d, viewBox, sw, start } = useMemo(() => {
    const pts = telemetry.points
    const xs = pts.map((p) => p.x * 500)
    const ys = pts.map((p) => p.y * 420)
    const x0 = Math.min(...xs), x1 = Math.max(...xs)
    const y0 = Math.min(...ys), y1 = Math.max(...ys)
    const w = x1 - x0, h = y1 - y0
    const pad = Math.max(w, h) * 0.09
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(p.x * 500).toFixed(1)} ${(p.y * 420).toFixed(1)}`).join(' ')
    return {
      d: path,
      viewBox: `${x0 - pad} ${y0 - pad} ${w + 2 * pad} ${h + 2 * pad}`,
      sw: Math.max(w, h) * 0.022,
      start: { x: xs[0], y: ys[0] },
    }
  }, [telemetry])

  return (
    <svg viewBox={viewBox} className="w-full max-h-60" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        key={drawKey}
        d={d}
        fill="none"
        stroke={revealed ? '#38b000' : ACCENT}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        initial={{ strokeDashoffset: 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ filter: `drop-shadow(0 0 8px ${revealed ? 'rgba(56,176,0,0.35)' : 'rgba(139,92,246,0.35)'})`, transition: 'stroke 0.3s' }}
      />
      <circle cx={start.x} cy={start.y} r={sw * 1.4} fill={revealed ? '#38b000' : ACCENT} />
    </svg>
  )
}

// ── Main game ────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'loading' | 'question' | 'answered' | 'finished'

export function NameThatLapGame() {
  const { data: races = [] } = useQuery({ queryKey: ['races'], queryFn: fetchRaces })
  const { data: circuitsMap = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers })

  const circuits = useMemo(() => (Object.values(circuitsMap) as Circuit[]).filter((c) => !c.variant), [circuitsMap])
  const driverName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const d of drivers as Driver[]) m[d.id] = d.name
    return m
  }, [drivers])

  const [phase, setPhase] = useState<Phase>('idle')
  const [round, setRound] = useState<Round | null>(null)
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [roundNum, setRoundNum] = useState(1)
  const [drawKey, setDrawKey] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [usedCircuits, setUsedCircuits] = useState<string[]>([])
  const [finalScore, setFinalScore] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)

  const gameRef = useRef<HTMLDivElement>(null)
  const loadId = useRef(0)

  const ready = races.length > 0 && circuits.length >= 4

  // Load a round's telemetry, guarding against overlapping loads.
  const loadRound = useCallback(async (used: string[]) => {
    const r = makeRound(races, circuits, used)
    if (!r) return
    const id = ++loadId.current
    setRound(r)
    setSelected(null)
    setTelemetry(null)
    setPhase('loading')
    try {
      const tel = await fetchTelemetry(r.race.telemetryFile)
      if (loadId.current !== id) return // superseded by a newer load
      setTelemetry(tel)
      setDrawKey((k) => k + 1)
      setPhase('question')
    } catch {
      if (loadId.current !== id) return
      // Skip a bad telemetry file by trying another race.
      loadRound([...used, r.race.circuit])
    }
  }, [races, circuits])

  const startGame = useCallback(() => {
    if (!ready) return
    const el = gameRef.current
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    setRoundNum(1)
    setSessionCorrect(0)
    setUsedCircuits([])
    setFinalScore(0)
    setIsNewBest(false)
    loadRound([])
  }, [ready, loadRound])

  const handleSelect = useCallback((optId: string) => {
    if (phase !== 'question' || !round) return
    setSelected(optId)
    if (optId === round.race.circuit) setSessionCorrect((n) => n + 1)
    setUsedCircuits((prev) => [...prev, round.race.circuit])
    setPhase('answered')
  }, [phase, round])

  const handleNext = useCallback(() => {
    if (!round) return
    if (roundNum >= TOTAL_ROUNDS) {
      const score = sessionCorrect
      const newBest = score > stats.bestScore
      const next: Stats = {
        bestScore: Math.max(stats.bestScore, score),
        totalCorrect: stats.totalCorrect + score,
        gamesPlayed: stats.gamesPlayed + 1,
      }
      setFinalScore(score)
      setIsNewBest(newBest)
      setStats(next)
      saveStats(next)
      setPhase('finished')
    } else {
      setRoundNum((n) => n + 1)
      loadRound(usedCircuits)
    }
  }, [round, roundNum, sessionCorrect, stats, usedCircuits, loadRound])

  const isCorrect = selected !== null && round !== null && selected === round.race.circuit
  const answered = phase === 'answered'

  if (!ready) {
    return (
      <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center">
        <p className="text-[#1a1712]/65 text-sm font-mono">Loading laps…</p>
      </div>
    )
  }

  return (
    <div ref={gameRef} className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5">
            <div className="flex items-center justify-center">
              <svg viewBox="0 0 120 60" className="h-16 w-auto opacity-40" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 40 C 20 10, 40 10, 50 30 S 80 55, 95 30 110 12, 112 20"
                  fill="none" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[#1a1712] text-sm leading-relaxed max-w-sm mx-auto">
              A real F1 lap is drawn out as a racing line — no name, no labels.
              Read the shape and pick the circuit from four options.
              {' '}{TOTAL_ROUNDS} laps, then your final score.
            </p>
            <button onClick={startGame}
              className="px-8 py-3 text-black font-semibold rounded-xl transition-all hover:brightness-110 hover:scale-105 active:scale-100"
              style={{ background: ACCENT }}>
              Start
            </button>
          </motion.div>
        )}

        {/* ── LOADING / QUESTION / ANSWERED ── */}
        {(phase === 'loading' || phase === 'question' || phase === 'answered') && round && (
          <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            <div className="flex items-center justify-between px-1">
              <p className="text-[#1a1712] text-xs font-mono uppercase tracking-widest">Name that lap</p>
              <span className="text-[#1a1712]/65 text-xs font-mono">{roundNum} / {TOTAL_ROUNDS}</span>
            </div>

            <div className="h-0.5 bg-[#ece6d9] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: ACCENT }}
                initial={{ width: `${((roundNum - 1) / TOTAL_ROUNDS) * 100}%` }}
                animate={{ width: `${(roundNum / TOTAL_ROUNDS) * 100}%` }}
                transition={{ duration: 0.3 }} />
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">
              {/* Left: lap trace */}
              <div className="rounded-2xl border bg-[#fbf9f4] flex items-center justify-center p-6"
                style={{ borderColor: answered ? (isCorrect ? 'rgba(56,176,0,0.4)' : 'rgba(232,0,45,0.4)') : '#dcd5c6', minHeight: 280 }}>
                {telemetry
                  ? <LapTrace telemetry={telemetry} drawKey={drawKey} revealed={answered} />
                  : <p className="text-[#1a1712]/50 text-sm font-mono">Drawing lap…</p>}
              </div>

              {/* Right: options + reveal */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {round.options.map((opt) => {
                    const isSel = selected === opt.id
                    const isAns = opt.id === round.race.circuit
                    const showCorrect = answered && isAns
                    const showWrong = answered && isSel && !isAns
                    return (
                      <motion.button key={opt.id}
                        onClick={() => handleSelect(opt.id)}
                        disabled={phase !== 'question'}
                        whileTap={phase === 'question' ? { scale: 0.98 } : {}}
                        className={[
                          'px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 text-left cursor-pointer disabled:cursor-default',
                          showCorrect ? 'bg-[#e6f0e0] border-[#38b000]/60 text-[#2e7d00]'
                          : showWrong ? 'bg-[#f7e3e3] border-[#e8002d]/60 text-[#c4122f]'
                          : answered ? 'bg-[#f3eee3] border-[#e2dccd] text-[#1a1712]/55'
                          : 'bg-white border-[#dcd5c6] text-[#1a1712] hover:bg-[#f3eefc]',
                        ].join(' ')}
                      >
                        {opt.name}
                      </motion.button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {answered && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] px-5 py-4">
                        <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: ACCENT }}>
                          {isCorrect ? 'Correct!' : `It was ${round.race.circuitName}`}
                        </p>
                        <p className="text-[#1a1712] text-sm leading-relaxed">
                          {driverName[round.race.driverId] ?? 'A driver'} · {round.race.name} · Lap {round.race.lapTime}
                        </p>
                      </div>
                      <button onClick={handleNext}
                        className="w-full px-6 py-3 text-black font-semibold rounded-xl transition-all hover:brightness-110 hover:scale-[1.02] active:scale-100"
                        style={{ background: ACCENT }}>
                        {roundNum >= TOTAL_ROUNDS ? 'See Results' : 'Next Lap'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FINISHED ── */}
        {phase === 'finished' && (() => {
          const rating = getGameRating(finalScore)
          return (
            <motion.div key="finished" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5">
              {isNewBest && <Confetti />}
              {isNewBest && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest"
                  style={{ color: ACCENT, background: `${ACCENT}1a`, border: `1px solid ${ACCENT}50` }}>
                  ★ New Personal Best
                </motion.div>
              )}
              <div>
                <p className="text-[#1a1712]/65 text-xs font-mono uppercase tracking-widest mb-3">Final Score</p>
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.08 }}
                  className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-bold font-mono" style={{ color: rating.color }}>{finalScore}</span>
                  <span className="text-2xl text-[#1a1712]/65 font-mono">/ 10</span>
                </motion.div>
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: rating.color }}>{rating.label}</p>
                <p className="text-[#1a1712] text-sm mt-1">{rating.sub}</p>
              </div>
              <div className="flex flex-col gap-3">
                <ShareButtons
                  text={`📈 Name That Lap\n${finalScore}/10 — ${rating.label}\nf1racesignature.site/games/name-that-lap`}
                  url="https://f1racesignature.site/games/name-that-lap"
                />
                <button onClick={startGame}
                  className="w-full px-6 py-3 text-black font-semibold rounded-xl transition-all hover:brightness-110 hover:scale-[1.02] active:scale-100"
                  style={{ background: ACCENT }}>
                  Play Again
                </button>
                <Leaderboard gameId="name-that-lap" score={finalScore} accent={ACCENT} />
                <NextGameCard currentId="name-that-lap" />
              </div>
            </motion.div>
          )
        })()}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.gamesPlayed > 0 && phase !== 'finished' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Best Score', value: `${stats.bestScore} / 10` },
            { label: 'Correct', value: String(stats.totalCorrect) },
            { label: 'Games', value: String(stats.gamesPlayed) },
          ].map((s) => (
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
