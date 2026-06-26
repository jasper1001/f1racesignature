'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { fetchCircuits } from '@/lib/data'
import type { Circuit } from '@/lib/types'

const STATS_KEY = 'f1rs_games_track_outline'
const TOTAL_ROUNDS = 10

// ── Circuit facts ─────────────────────────────────────────────────────────────
const CIRCUIT_FACTS: Record<string, string> = {
  monaco:      'Monaco is the slowest circuit on the calendar — yet a win here is considered the most prestigious in all of Formula 1.',
  silverstone: 'Silverstone hosted the very first Formula 1 World Championship race in 1950 and has been on the calendar almost every year since.',
  suzuka:      'Suzuka\'s figure-8 layout is unique in F1 — cars cross directly over themselves via an underpass at the first chicane.',
  spa:         'Spa-Francorchamps is the longest circuit on the calendar at 7.004 km. Its weather is so unpredictable it can rain on one sector while the sun shines on another.',
  monza:       'Known as the "Temple of Speed", Monza has been on the calendar continuously since the championship began in 1950.',
  abu_dhabi:   'The Yas Marina Circuit is the only track in F1 with a hotel — the Yas Viceroy — built directly over part of the circuit.',
  bahrain:     'The Bahrain International Circuit was the first in the Middle East to host a Formula 1 Grand Prix when it opened in 2004.',
  baku:        'The Baku City Circuit features the longest straight in modern F1 — over 2 km — and one of the narrowest sections at just 7.6 metres wide.',
  hungaroring: 'The Hungaroring was the first permanent circuit behind the Iron Curtain when it hosted the inaugural Hungarian Grand Prix in 1986.',
  interlagos:  'Interlagos runs anticlockwise, which is unusual for Formula 1. It also sits 800 metres above sea level.',
  marina_bay:  'The Marina Bay Street Circuit in Singapore was the first night race in Formula 1 history when it debuted in 2008.',
  miami:       'The Miami International Autodrome, which joined the calendar in 2022, is built around the Hard Rock Stadium.',
}

function getGameRating(score: number) {
  if (score === 10) return { label: 'Perfect Lap',      color: '#d4a017', sub: 'You know every corner of the F1 calendar.' }
  if (score >= 8)  return { label: 'F1 Expert',         color: '#c0c0c0', sub: 'You clearly spend your weekends watching qualifying.' }
  if (score >= 6)  return { label: 'Circuit Analyst',   color: '#cd7f32', sub: 'Solid knowledge — keep studying the map.' }
  if (score >= 4)  return { label: 'Getting There',     color: '#888888', sub: 'A few more races and you\'ll be an expert.' }
  return           { label: 'Keep Watching',             color: '#555555', sub: 'Time to study the Formula 1 calendar.' }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
interface Stats {
  bestScore: number
  totalCorrect: number
  gamesPlayed: number
}

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateQuestion(circuits: Circuit[], excludeIds: string[]) {
  const pool = circuits.filter(c => !excludeIds.includes(c.id))
  const answer = pool[Math.floor(Math.random() * pool.length)]
  const wrong = shuffle(circuits.filter(c => c.id !== answer.id)).slice(0, 3)
  return { answer, options: shuffle([answer, ...wrong]) }
}

function strokeWidthFromViewBox(viewBox: string): number {
  const parts = viewBox.split(' ')
  const w = parseFloat(parts[2]) || 500
  return w * 0.02
}

// ── Circuit silhouette ────────────────────────────────────────────────────────
function CircuitSilhouette({ circuit, flash }: { circuit: Circuit; flash: 'none' | 'correct' | 'wrong' }) {
  const sw = strokeWidthFromViewBox(circuit.viewBox)
  const color = flash === 'correct' ? '#2e8b00' : flash === 'wrong' ? '#d11030' : '#16120c'
  const glow  = flash === 'correct' ? '0 0 16px 4px rgba(56,176,0,0.4)' : flash === 'wrong' ? '0 0 16px 4px rgba(232,0,45,0.4)' : '0 0 10px 2px rgba(0,0,0,0.10)'

  return (
    <div className="w-full flex items-center justify-center p-6 md:p-8">
      <svg viewBox={circuit.viewBox} className="w-full max-h-52" style={{ filter: `drop-shadow(${glow})` }} xmlns="http://www.w3.org/2000/svg">
        <path d={circuit.path} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }} />
      </svg>
    </div>
  )
}

// ── Main game ─────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'question' | 'answered' | 'finished'

export function TrackOutlineGame() {
  const { data: circuitsMap = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })
  const circuits = Object.values(circuitsMap) as Circuit[]

  const [phase, setPhase]               = useState<Phase>('idle')
  const [answer, setAnswer]             = useState<Circuit | null>(null)
  const [options, setOptions]           = useState<Circuit[]>([])
  const [selected, setSelected]         = useState<string | null>(null)
  const [round, setRound]               = useState(1)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [usedIds, setUsedIds]           = useState<string[]>([])
  const [finalScore, setFinalScore]     = useState(0)
  const [isNewBest, setIsNewBest]       = useState(false)
  const [stats, setStats]               = useState<Stats>(loadStats)
  const gameRef = useRef<HTMLDivElement>(null)
  const startGame = useCallback(() => {
    if (circuits.length < 4) return
    const el = gameRef.current
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    const q = generateQuestion(circuits, [])
    setAnswer(q.answer)
    setOptions(q.options)
    setSelected(null)
    setRound(1)
    setSessionCorrect(0)
    setUsedIds([q.answer.id])
    setFinalScore(0)
    setIsNewBest(false)
    setPhase('question')
  }, [circuits])

  const handleSelect = useCallback((circuitId: string) => {
    if (phase !== 'question' || !answer) return
    setSelected(circuitId)
    if (circuitId === answer.id) setSessionCorrect(n => n + 1)
    setPhase('answered')
  }, [phase, answer])

  const handleNext = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      // End of game — sessionCorrect already includes this round's result
      const score = sessionCorrect
      const newBest = score > stats.bestScore
      const newStats: Stats = {
        bestScore: Math.max(stats.bestScore, score),
        totalCorrect: stats.totalCorrect + score,
        gamesPlayed: stats.gamesPlayed + 1,
      }
      setFinalScore(score)
      setIsNewBest(newBest)
      setStats(newStats)
      saveStats(newStats)
      setPhase('finished')
    } else {
      const nextRound = round + 1
      const q = generateQuestion(circuits, usedIds)
      setAnswer(q.answer)
      setOptions(q.options)
      setSelected(null)
      setUsedIds(prev => [...prev, q.answer.id])
      setRound(nextRound)
      setPhase('question')
    }
  }, [round, sessionCorrect, stats, circuits, usedIds])

  const isCorrect = selected !== null && answer !== null && selected === answer.id
  const flash: 'none' | 'correct' | 'wrong' = phase !== 'answered' ? 'none' : isCorrect ? 'correct' : 'wrong'

  if (circuits.length === 0) {
    return (
      <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center">
        <p className="text-[#1a1712]/65 text-sm font-mono">Loading circuits…</p>
      </div>
    )
  }

  return (
    <div ref={gameRef} className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5"
          >
            <div className="flex items-center justify-center gap-4 opacity-30">
              {circuits.slice(0, 3).map(c => (
                <svg key={c.id} viewBox={c.viewBox} className="h-16 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d={c.path} fill="none" stroke="#16120c" strokeWidth={strokeWidthFromViewBox(c.viewBox)} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ))}
            </div>
            <p className="text-[#1a1712] text-sm leading-relaxed max-w-sm mx-auto">
              A circuit silhouette is shown — no name, no labels.
              Pick the correct track from four options.
              10 circuits, then your final score.
            </p>
            <button onClick={startGame}
              className="px-8 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100 cursor-pointer"
            >
              Start
            </button>
          </motion.div>
        )}

        {/* ── QUESTION / ANSWERED ── */}
        {(phase === 'question' || phase === 'answered') && answer && (
          <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Round header */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[#1a1712] text-xs font-mono uppercase tracking-widest">Which circuit is this?</p>
              <span className="text-[#1a1712]/65 text-xs font-mono">{round} / {TOTAL_ROUNDS}</span>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-[#ece6d9] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#d4a017] rounded-full"
                initial={{ width: `${((round - 1) / TOTAL_ROUNDS) * 100}%` }}
                animate={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* 2-col on desktop */}
            <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">
              {/* Left: Circuit silhouette */}
              <div
                className="rounded-2xl border bg-[#fbf9f4] transition-colors duration-300 flex items-center"
                style={{ borderColor: phase === 'answered' ? (isCorrect ? 'rgba(56,176,0,0.4)' : 'rgba(232,0,45,0.4)') : '#dcd5c6', minHeight: 280 }}
              >
                <CircuitSilhouette circuit={answer} flash={flash} />
              </div>

              {/* Right: Options + post-answer */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {options.map(opt => {
                    const isSelected = selected === opt.id
                    const isAnswer   = opt.id === answer.id
                    const showCorrect = phase === 'answered' && isAnswer
                    const showWrong   = phase === 'answered' && isSelected && !isAnswer
                    return (
                      <motion.button
                        key={opt.id}
                        onClick={() => handleSelect(opt.id)}
                        disabled={phase === 'answered'}
                        whileTap={phase === 'question' ? { scale: 0.97 } : {}}
                        className={[
                          'px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 text-left cursor-pointer disabled:cursor-default',
                          showCorrect  ? 'bg-[#e6f0e0] border-[#38b000]/60 text-[#2e7d00]'
                          : showWrong  ? 'bg-[#f7e3e3] border-[#e8002d]/60 text-[#c4122f]'
                          : phase === 'answered' ? 'bg-[#f3eee3] border-[#e2dccd] text-[#1a1712]/55'
                          : 'bg-[#ffffff] border-[#dcd5c6] text-[#1a1712] hover:border-[#d4a017]/50 hover:bg-[#f7efd6]',
                        ].join(' ')}
                      >
                        {opt.name}
                      </motion.button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {phase === 'answered' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] px-5 py-4">
                        <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-2">
                          {isCorrect ? 'Correct!' : `It was ${answer.name}`}
                        </p>
                        <p className="text-[#1a1712] text-sm leading-relaxed">
                          {CIRCUIT_FACTS[answer.id] ?? `${answer.name} — ${answer.location}.`}
                        </p>
                      </div>
                      <button onClick={handleNext}
                        className="w-full px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-[1.02] active:scale-100 cursor-pointer"
                      >
                        {round >= TOTAL_ROUNDS ? 'See Results' : 'Next Track'}
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
              className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5"
            >
              {isNewBest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-full text-[#d4a017] text-xs font-mono uppercase tracking-widest"
                >
                  ★ New Personal Best
                </motion.div>
              )}

              <div>
                <p className="text-[#1a1712]/65 text-xs font-mono uppercase tracking-widest mb-3">Final Score</p>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.08 }}
                  className="flex items-baseline justify-center gap-1"
                >
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
                  text={`🏎️ Track Outline Quiz\n${finalScore}/10 — ${rating.label}\nf1racesignature.site/games/track-outline`}
                  url="https://f1racesignature.site/games/track-outline"
                />
                <button onClick={startGame}
                  className="w-full px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-[1.02] active:scale-100 cursor-pointer"
                >
                  Play Again
                </button>
                <NextGameCard currentId="track-outline" />
              </div>
            </motion.div>
          )
        })()}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.gamesPlayed > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Best Score', value: `${stats.bestScore} / 10` },
            { label: 'Correct',    value: String(stats.totalCorrect) },
            { label: 'Games',      value: String(stats.gamesPlayed) },
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
