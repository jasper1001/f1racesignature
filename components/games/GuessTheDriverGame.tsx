'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DRIVERS, CLUE_DEFS, scorePotential, type DriverEntry } from '@/lib/games/guessDriverData'
import { ShareButtons } from '@/components/games/ShareButtons'

const STATS_KEY = 'f1rs_games_guess_driver'

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

function pickDriver(exclude?: string): DriverEntry {
  const pool = exclude ? DRIVERS.filter(d => d.id !== exclude) : DRIVERS
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Autocomplete input ────────────────────────────────────────────────────────
function AutocompleteInput({
  onGuess,
  disabled,
}: {
  onGuess: (name: string) => void
  disabled: boolean
}) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return DRIVERS.filter(d => d.name.toLowerCase().includes(q)).slice(0, 8)
  }, [value])

  useEffect(() => { setOpen(filtered.length > 0) }, [filtered])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (filtered.length === 1) { submit(filtered[0].name); return }
      const exact = DRIVERS.find(d => d.name.toLowerCase() === value.toLowerCase())
      if (exact) submit(exact.name)
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => { if (filtered.length > 0) setOpen(true) }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a driver name…"
        autoComplete="off"
        spellCheck={false}
        className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-xl text-white text-sm font-mono placeholder-[#333333] focus:outline-none focus:border-[#d4a017]/50 transition-colors disabled:opacity-40"
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1.5 left-0 right-0 bg-[#0f0f0f] border border-[#222222] rounded-xl overflow-hidden z-20 shadow-xl"
          >
            {filtered.map(d => (
              <button
                key={d.id}
                onMouseDown={e => { e.preventDefault(); submit(d.name) }}
                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#1a1a1a] transition-colors font-mono border-b border-[#111111] last:border-0 cursor-pointer"
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

// ── Clue card ─────────────────────────────────────────────────────────────────
function ClueCard({ label, value, index }: { label: string; value: string | number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-3"
    >
      <p className="text-[#555555] text-[10px] font-mono uppercase tracking-widest mb-1">{label}</p>
      <p className="text-white text-sm font-medium leading-snug">{value}</p>
    </motion.div>
  )
}

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score === 100 ? '#d4a017' : score === 80 ? '#c0c0c0' : score === 60 ? '#cd7f32' : '#555555'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#333333] text-xs font-mono">Worth</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>{score} pts</span>
    </div>
  )
}

// ── Main game ─────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'playing' | 'correct' | 'failed'

export function GuessTheDriverGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [driver, setDriver] = useState<DriverEntry | null>(null)
  const [revealedCount, setRevealedCount] = useState(1)
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([])
  const [finalScore, setFinalScore] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)
  const gameRef = useRef<HTMLDivElement>(null)
  const lastDriverId = useRef<string | undefined>(undefined)

  const startRound = useCallback(() => {
    const el = gameRef.current
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    const d = pickDriver(lastDriverId.current)
    lastDriverId.current = d.id
    setDriver(d)
    setRevealedCount(1)
    setWrongGuesses([])
    setFinalScore(0)
    setIsNewBest(false)
    setPhase('playing')
  }, [])

  const handleGuess = useCallback((name: string) => {
    if (!driver) return

    if (name.toLowerCase() === driver.name.toLowerCase()) {
      const score = scorePotential(revealedCount)
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
      setWrongGuesses(prev =>
        prev.includes(name) ? prev : [...prev, name]
      )
    }
  }, [driver, revealedCount, stats])

  const revealNext = () => {
    if (revealedCount < CLUE_DEFS.length) setRevealedCount(n => n + 1)
  }

  const giveUp = useCallback(() => {
    const newStats: Stats = {
      ...stats,
      roundsPlayed: stats.roundsPlayed + 1,
    }
    setStats(newStats)
    saveStats(newStats)
    setFinalScore(0)
    setPhase('failed')
  }, [stats])

  const revealedClues = driver ? CLUE_DEFS.slice(0, revealedCount) : []
  const allRevealed = revealedCount >= CLUE_DEFS.length
  const potential = scorePotential(revealedCount)

  return (
    <div ref={gameRef} className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 text-center space-y-5"
          >
            <p className="text-white text-sm leading-relaxed max-w-sm mx-auto">
              Clues about an F1 driver are revealed one at a time.
              Guess with fewer clues for a higher score. Don&apos;t know? Reveal another clue.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-left">
              {[
                { clue: '1st clue', pts: '100 pts', color: '#d4a017' },
                { clue: '2nd clue', pts: '80 pts', color: '#c0c0c0' },
                { clue: '3rd clue', pts: '60 pts', color: '#cd7f32' },
                { clue: '4th clue', pts: '40 pts', color: '#888888' },
              ].map(r => (
                <div key={r.clue} className="flex items-center justify-between rounded-lg border border-[#111111] bg-[#060606] px-3 py-2">
                  <span className="text-[#555555] text-xs font-mono">{r.clue}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: r.color }}>{r.pts}</span>
                </div>
              ))}
            </div>
            <button
              onClick={startRound}
              className="px-8 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100 cursor-pointer"
            >
              Start
            </button>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {phase === 'playing' && driver && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <p className="text-white text-xs font-mono opacity-30">
                Clue {revealedCount} of {CLUE_DEFS.length}
              </p>
              <ScoreBadge score={potential} />
            </div>

            {/* 2-col on desktop */}
            <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">
              {/* Left: Clue cards */}
              <div className="space-y-2">
                {revealedClues.map((def, i) => (
                  <ClueCard
                    key={def.key}
                    label={def.label}
                    value={driver.clues[def.key] as string | number}
                    index={i}
                  />
                ))}
              </div>

              {/* Right: Wrong guesses + input + controls */}
              <div className="space-y-3">
                {wrongGuesses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {wrongGuesses.map(g => (
                      <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a0505] border border-[#e8002d]/20 text-[#e8002d] text-xs font-mono">
                        {g} ✕
                      </span>
                    ))}
                  </div>
                )}
                <AutocompleteInput onGuess={handleGuess} disabled={false} />
                <div className="flex gap-2">
                  <button
                    onClick={revealNext}
                    disabled={allRevealed}
                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-[#111111] border border-[#222222] text-white rounded-xl hover:border-[#333333] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {allRevealed ? 'All Clues Revealed' : revealedCount === CLUE_DEFS.length - 1 ? 'Reveal Final Clue' : 'Reveal Next Clue'}
                  </button>
                  <button
                    onClick={giveUp}
                    className="px-4 py-2.5 text-sm font-medium bg-transparent border border-[#1a1a1a] text-white opacity-30 rounded-xl hover:opacity-80 hover:border-[#333333] transition-all cursor-pointer"
                  >
                    Give Up
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CORRECT ── */}
        {phase === 'correct' && driver && (
          <motion.div
            key="correct"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 text-center space-y-5"
          >
            {isNewBest && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-full text-[#d4a017] text-xs font-mono uppercase tracking-widest"
              >
                ★ New Personal Best
              </motion.div>
            )}

            <div>
              <p className="text-[#38b000] text-xs font-mono uppercase tracking-widest mb-2">Correct!</p>
              <p className="text-white text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {driver.name}
              </p>
            </div>

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
              className="flex items-baseline justify-center gap-1"
            >
              <span className="text-5xl font-bold font-mono" style={{ color: finalScore === 100 ? '#d4a017' : finalScore === 80 ? '#c0c0c0' : finalScore === 60 ? '#cd7f32' : '#555555' }}>
                +{finalScore}
              </span>
              <span className="text-lg text-white/20 font-mono">pts</span>
            </motion.div>

            <div className="rounded-xl border border-[#1a1a1a] bg-[#060606] px-5 py-4 text-left">
              <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-2">Did You Know?</p>
              <p className="text-white text-sm leading-relaxed">{driver.fact}</p>
            </div>

            <div className="flex flex-col gap-3">
              <ShareButtons
                text={`🏎️ Guess the Driver\n✓ ${driver.name} — +${finalScore} pts\nf1racesignature.site/games/guess-the-driver`}
                url="https://f1racesignature.site/games/guess-the-driver"
              />
              <button
                onClick={startRound}
                className="w-full px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-[1.02] active:scale-100 cursor-pointer"
              >
                Next Driver
              </button>
            </div>
          </motion.div>
        )}

        {/* ── FAILED ── */}
        {phase === 'failed' && driver && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 text-center space-y-5"
          >
            <div>
              <p className="text-[#555555] text-xs font-mono uppercase tracking-widest mb-2">The answer was</p>
              <p className="text-white text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {driver.name}
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a1a] bg-[#060606] px-5 py-4 text-left">
              <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-2">Did You Know?</p>
              <p className="text-white text-sm leading-relaxed">{driver.fact}</p>
            </div>

            <button
              onClick={startRound}
              className="w-full px-6 py-3 bg-[#111111] border border-[#222222] text-white font-semibold rounded-xl hover:border-[#333333] transition-colors cursor-pointer"
            >
              Try Another Driver
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.roundsPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Best Score', value: `${stats.bestScore} pts` },
            { label: 'Correct', value: String(stats.totalCorrect) },
            { label: 'Played', value: String(stats.roundsPlayed) },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#141414] bg-[#070707] px-3 py-3 text-center">
              <p className="text-white text-base font-mono font-bold">{s.value}</p>
              <p className="text-[#888888] text-[10px] font-mono uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
