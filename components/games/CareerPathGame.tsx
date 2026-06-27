'use client'

import { Fragment, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Leaderboard } from '@/components/games/Leaderboard'
import { DRIVERS, type Driver } from '@/lib/games/predictDriverData'

const ACCENT = '#0ea5e9'
const STATS_KEY = 'f1rs_games_career_path'

// Only drivers with a real multi-team path make a puzzle.
const POOL = DRIVERS.filter(d => d.teams.length >= 2)

interface Stats {
  bestScore: number
  totalCorrect: number
  roundsPlayed: number
}

function loadStats(): Stats {
  if (typeof window === 'undefined') return { bestScore: 0, totalCorrect: 0, roundsPlayed: 0 }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { bestScore: 0, totalCorrect: 0, roundsPlayed: 0 }
  } catch { return { bestScore: 0, totalCorrect: 0, roundsPlayed: 0 } }
}
function saveStats(s: Stats) {
  if (typeof window !== 'undefined') localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

/** Points available if you guess with `revealed` teams showing (fewer = more). */
function scorePotential(revealed: number): number {
  return [100, 80, 60, 40, 20][Math.min(revealed - 1, 4)]
}

function pickDriver(exclude?: string): Driver {
  const pool = exclude ? POOL.filter(d => d.id !== exclude) : POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

function driverSummary(d: Driver): string {
  const titles = d.championships > 0 ? `${d.championships}× World Champion` : 'No titles'
  return `${d.nationality} · Debuted ${d.debutYear} · ${titles} · ${d.wins} wins`
}

// ── Autocomplete ────────────────────────────────────────────────────────────────
function AutocompleteInput({ onGuess }: { onGuess: (name: string) => void }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return DRIVERS.filter(d => d.name.toLowerCase().includes(q)).slice(0, 8)
  }, [value])

  useEffect(() => { setOpen(filtered.length > 0) }, [filtered])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const submit = useCallback((name: string) => {
    const match = DRIVERS.find(d => d.name.toLowerCase() === name.toLowerCase())
    if (!match) return
    onGuess(match.name)
    setValue('')
    setOpen(false)
  }, [onGuess])

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => { if (filtered.length > 0) setOpen(true) }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            if (filtered.length >= 1) submit(filtered[0].name)
          } else if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Type a driver name…"
        autoComplete="off"
        spellCheck={false}
        className="w-full px-4 py-3 bg-[#ffffff] border border-[#cfc7b5] rounded-xl text-[#1a1712] text-sm font-mono placeholder-[#a89f8c] focus:outline-none focus:border-[#0ea5e9]/50 transition-colors"
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1.5 left-0 right-0 bg-[#ffffff] border border-[#cfc7b5] rounded-xl overflow-hidden z-20 shadow-xl"
          >
            {filtered.map(d => (
              <button
                key={d.id}
                onMouseDown={e => { e.preventDefault(); submit(d.name) }}
                className="w-full text-left px-4 py-2.5 text-sm text-[#1a1712] hover:bg-[#efe9dd] transition-colors font-mono border-b border-[#e2dccd] last:border-0 cursor-pointer"
              >
                {d.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Career path display ───────────────────────────────────────────────────────
function PathDisplay({ teams, revealed }: { teams: string[]; revealed: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {teams.map((team, i) => {
        const shown = i < revealed
        return (
          <Fragment key={i}>
            {i > 0 && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-40">
                <path d="M4 8h8M9 5l3 3-3 3" stroke="#1a1712" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <motion.span
              initial={shown ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border ${
                shown
                  ? 'bg-[#0ea5e9]/8 border-[#0ea5e9]/35 text-[#1a1712]'
                  : 'bg-[#f3eee3] border-dashed border-[#d0c8b6] text-[#a89f8c]'
              }`}
            >
              {shown ? team : '???'}
            </motion.span>
          </Fragment>
        )
      })}
    </div>
  )
}

// ── Main game ─────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'playing' | 'correct' | 'failed'

export function CareerPathGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [driver, setDriver] = useState<Driver | null>(null)
  const [revealed, setRevealed] = useState(1)
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
  const [finalScore, setFinalScore] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)
  const gameRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<string | undefined>(undefined)

  const startRound = useCallback(() => {
    const el = gameRef.current
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    const d = pickDriver(lastIdRef.current)
    lastIdRef.current = d.id
    setDriver(d)
    setRevealed(1)
    setWrongGuesses([])
    setFinalScore(0)
    setIsNewBest(false)
    setPhase('playing')
  }, [])

  const handleGuess = useCallback((name: string) => {
    if (!driver) return
    if (name.toLowerCase() === driver.name.toLowerCase()) {
      const score = scorePotential(revealed)
      setFinalScore(score)
      const newStats: Stats = {
        bestScore: Math.max(stats.bestScore, score),
        totalCorrect: stats.totalCorrect + 1,
        roundsPlayed: stats.roundsPlayed + 1,
      }
      setIsNewBest(score > stats.bestScore)
      setStats(newStats)
      saveStats(newStats)
      setPhase('correct')
    } else {
      setWrongGuesses(prev => (prev.includes(name) ? prev : [...prev, name]))
    }
  }, [driver, revealed, stats])

  const revealNext = () => {
    if (driver && revealed < driver.teams.length) setRevealed(n => n + 1)
  }

  const giveUp = useCallback(() => {
    const newStats: Stats = { ...stats, roundsPlayed: stats.roundsPlayed + 1 }
    setStats(newStats)
    saveStats(newStats)
    setFinalScore(0)
    setPhase('failed')
  }, [stats])

  const allRevealed = driver ? revealed >= driver.teams.length : false
  const potential = scorePotential(revealed)

  return (
    <div ref={gameRef} className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 opacity-60">
              {['Toro Rosso', 'Red Bull', 'Aston Martin', '???'].map((t, i) => (
                <Fragment key={i}>
                  {i > 0 && <span className="text-[#1a1712]/30">→</span>}
                  <span className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                    t === '???' ? 'bg-[#f3eee3] border-dashed border-[#d0c8b6] text-[#a89f8c]' : 'bg-[#0ea5e9]/8 border-[#0ea5e9]/30 text-[#1a1712]'
                  }`}>{t}</span>
                </Fragment>
              ))}
            </div>
            <p className="text-[#1a1712] text-sm leading-relaxed max-w-sm mx-auto">
              A driver&apos;s teams are revealed one at a time, in order. Name the driver —
              the fewer teams you need, the higher your score.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-left">
              {[
                { label: '1 team', pts: '100 pts' },
                { label: '2 teams', pts: '80 pts' },
                { label: '3 teams', pts: '60 pts' },
                { label: '4+ teams', pts: '40 pts' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between rounded-lg border border-[#e2dccd] bg-[#fbf9f4] px-3 py-2">
                  <span className="text-[#1a1712]/65 text-xs font-mono">{r.label}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: ACCENT }}>{r.pts}</span>
                </div>
              ))}
            </div>
            <button onClick={startRound}
              className="px-8 py-3 text-black font-semibold rounded-xl transition-all hover:brightness-105 hover:scale-105 active:scale-100 cursor-pointer"
              style={{ background: ACCENT }}
            >
              Start
            </button>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {phase === 'playing' && driver && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[#1a1712]/40 text-xs font-mono">
                {revealed} of {driver.teams.length} teams
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[#1a1712]/65 text-xs font-mono">Worth</span>
                <span className="text-sm font-bold font-mono" style={{ color: ACCENT }}>{potential} pts</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] px-5 py-5">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: ACCENT }}>Career path</p>
              <PathDisplay teams={driver.teams} revealed={revealed} />
            </div>

            {wrongGuesses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {wrongGuesses.map(g => (
                  <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f7e3e3] border border-[#e8002d]/30 text-[#c4122f] text-xs font-mono">
                    {g} ✕
                  </span>
                ))}
              </div>
            )}

            <AutocompleteInput onGuess={handleGuess} />

            <div className="flex gap-2">
              <button
                onClick={revealNext}
                disabled={allRevealed}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#ece6d9] border border-[#cfc7b5] text-[#1a1712] rounded-xl hover:border-[#c4bca8] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {allRevealed ? 'All Teams Revealed' : 'Reveal Next Team'}
              </button>
              <button
                onClick={giveUp}
                className="px-4 py-2.5 text-sm font-medium bg-transparent border border-[#dcd5c6] text-[#1a1712] opacity-40 rounded-xl hover:opacity-80 hover:border-[#c4bca8] transition-all cursor-pointer"
              >
                Give Up
              </button>
            </div>
          </motion.div>
        )}

        {/* ── CORRECT ── */}
        {phase === 'correct' && driver && (
          <motion.div key="correct" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5"
          >
            {isNewBest && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest"
                style={{ color: ACCENT, background: `${ACCENT}1a`, border: `1px solid ${ACCENT}4d` }}
              >
                ★ New Personal Best
              </motion.div>
            )}
            <div>
              <p className="text-[#38b000] text-xs font-mono uppercase tracking-widest mb-2">Correct!</p>
              <p className="text-[#1a1712] text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {driver.name}
              </p>
              <p className="text-[#1a1712]/55 text-xs mt-1">{driverSummary(driver)}</p>
            </div>

            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
              className="flex items-baseline justify-center gap-1"
            >
              <span className="text-5xl font-bold font-mono" style={{ color: ACCENT }}>+{finalScore}</span>
              <span className="text-lg text-[#1a1712]/55 font-mono">pts</span>
            </motion.div>

            <div className="rounded-xl border border-[#e2dccd] bg-[#f4f1ea] px-5 py-4">
              <PathDisplay teams={driver.teams} revealed={driver.teams.length} />
            </div>

            <div className="flex flex-col gap-3">
              <ShareButtons
                text={`🏎️ F1 Career Path\n✓ ${driver.name} — +${finalScore} pts\nf1racesignature.site/games/career-path`}
                url="https://f1racesignature.site/games/career-path"
              />
              <button onClick={startRound}
                className="w-full px-6 py-3 text-black font-semibold rounded-xl transition-all hover:brightness-105 hover:scale-[1.02] active:scale-100 cursor-pointer"
                style={{ background: ACCENT }}
              >
                Next Driver
              </button>
              <Leaderboard gameId="career-path" score={finalScore} accent="#0ea5e9" />
              <NextGameCard currentId="career-path" />
            </div>
          </motion.div>
        )}

        {/* ── FAILED ── */}
        {phase === 'failed' && driver && (
          <motion.div key="failed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5"
          >
            <div>
              <p className="text-[#1a1712]/65 text-xs font-mono uppercase tracking-widest mb-2">The answer was</p>
              <p className="text-[#1a1712] text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {driver.name}
              </p>
              <p className="text-[#1a1712]/55 text-xs mt-1">{driverSummary(driver)}</p>
            </div>

            <div className="rounded-xl border border-[#e2dccd] bg-[#f4f1ea] px-5 py-4">
              <PathDisplay teams={driver.teams} revealed={driver.teams.length} />
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={startRound}
                className="w-full px-6 py-3 bg-[#ece6d9] border border-[#cfc7b5] text-[#1a1712] font-semibold rounded-xl hover:border-[#c4bca8] transition-colors cursor-pointer"
              >
                Try Another Driver
              </button>
              <NextGameCard currentId="career-path" />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.roundsPlayed > 0 && phase !== 'correct' && phase !== 'failed' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Best Score', value: `${stats.bestScore} pts` },
            { label: 'Correct', value: String(stats.totalCorrect) },
            { label: 'Played', value: String(stats.roundsPlayed) },
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
