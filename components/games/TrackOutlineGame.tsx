'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchCircuits } from '@/lib/data'
import type { Circuit } from '@/lib/types'

const STATS_KEY = 'f1rs_games_track_outline'

// ── Circuit facts ─────────────────────────────────────────────────────────────
const CIRCUIT_FACTS: Record<string, string> = {
  monaco:      'Monaco is the slowest circuit on the calendar — yet a win here is considered the most prestigious in all of Formula 1.',
  silverstone: 'Silverstone hosted the very first Formula 1 World Championship race in 1950 and has been on the calendar almost every year since.',
  suzuka:      'Suzuka\'s figure-8 layout is unique in F1 — cars cross directly over themselves via an underpass at the first chicane.',
  spa:         'Spa-Francorchamps is the longest circuit on the calendar at 7.004 km. Its weather is so unpredictable it can rain on one sector while the sun shines on another.',
  monza:       'Known as the "Temple of Speed", Monza has been on the calendar continuously since the championship began in 1950.',
  abu_dhabi:   'The Yas Marina Circuit is the only track in F1 with a hotel — the Yas Viceroy — built directly over part of the circuit.',
  bahrain:     'The Bahrain International Circuit was the first in the Middle East to host a Formula 1 Grand Prix when it opened in 2004.',
  baku:        'The Baku City Circuit features the longest straight in modern F1 — over 2 km — and one of the narrowest castle sections at just 7.6 metres wide.',
  hungaroring: 'The Hungaroring was the first permanent circuit behind the Iron Curtain when it hosted the inaugural Hungarian Grand Prix in 1986.',
  interlagos:  'Interlagos runs anticlockwise, which is unusual for Formula 1. It is also one of the few circuits at altitude, sitting 800 metres above sea level.',
  marina_bay:  'The Marina Bay Street Circuit in Singapore was the first night race in Formula 1 history when it debuted in 2008.',
  miami:       'The Miami International Autodrome, which joined the calendar in 2022, is built around the Hard Rock Stadium in Miami Gardens.',
}

// ── Stats ─────────────────────────────────────────────────────────────────────
interface Stats {
  bestStreak: number
  totalCorrect: number
  totalPlayed: number
}

function loadStats(): Stats {
  if (typeof window === 'undefined') return { bestStreak: 0, totalCorrect: 0, totalPlayed: 0 }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { bestStreak: 0, totalCorrect: 0, totalPlayed: 0 }
  } catch { return { bestStreak: 0, totalCorrect: 0, totalPlayed: 0 } }
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

function generateQuestion(circuits: Circuit[], excludeId?: string) {
  const pool = excludeId ? circuits.filter(c => c.id !== excludeId) : circuits
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

  const color =
    flash === 'correct' ? '#38b000' :
    flash === 'wrong'   ? '#e8002d' :
    '#ffffff'

  const glow =
    flash === 'correct' ? '0 0 16px 4px rgba(56,176,0,0.4)'  :
    flash === 'wrong'   ? '0 0 16px 4px rgba(232,0,45,0.4)'  :
    '0 0 12px 2px rgba(255,255,255,0.08)'

  return (
    <div className="w-full flex items-center justify-center p-6 md:p-8">
      <svg
        viewBox={circuit.viewBox}
        className="w-full max-h-52"
        style={{ filter: `drop-shadow(${glow})` }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={circuit.path}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'stroke 0.2s' }}
        />
      </svg>
    </div>
  )
}

// ── Main game ─────────────────────────────────────────────────────────────────
type Phase = 'idle' | 'question' | 'answered'

export function TrackOutlineGame() {
  const { data: circuitsMap = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })
  const circuits = Object.values(circuitsMap) as Circuit[]

  const [phase, setPhase] = useState<Phase>('idle')
  const [answer, setAnswer] = useState<Circuit | null>(null)
  const [options, setOptions] = useState<Circuit[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState<Stats>(loadStats)
  const lastIdRef = { current: undefined as string | undefined }

  const startQuestion = useCallback((excludeId?: string) => {
    if (circuits.length < 4) return
    const q = generateQuestion(circuits, excludeId)
    setAnswer(q.answer)
    setOptions(q.options)
    setSelected(null)
    setPhase('question')
  }, [circuits])

  const handleSelect = useCallback((circuitId: string) => {
    if (phase !== 'question' || !answer) return
    setSelected(circuitId)

    const correct = circuitId === answer.id
    const newStreak = correct ? streak + 1 : 0
    setStreak(newStreak)

    const newStats: Stats = {
      bestStreak: Math.max(stats.bestStreak, newStreak),
      totalCorrect: stats.totalCorrect + (correct ? 1 : 0),
      totalPlayed: stats.totalPlayed + 1,
    }
    setStats(newStats)
    saveStats(newStats)
    setPhase('answered')
  }, [phase, answer, streak, stats])

  const handleNext = useCallback(() => {
    startQuestion(answer?.id)
  }, [startQuestion, answer])

  const isCorrect = selected !== null && answer !== null && selected === answer.id
  const flash: 'none' | 'correct' | 'wrong' =
    phase !== 'answered' ? 'none' : isCorrect ? 'correct' : 'wrong'

  if (circuits.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 text-center">
        <p className="text-[#555555] text-sm font-mono">Loading circuits…</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
            {/* Preview silhouettes */}
            <div className="flex items-center justify-center gap-4 opacity-40">
              {circuits.slice(0, 3).map(c => (
                <svg key={c.id} viewBox={c.viewBox} className="h-16 w-auto" xmlns="http://www.w3.org/2000/svg">
                  <path d={c.path} fill="none" stroke="white" strokeWidth={strokeWidthFromViewBox(c.viewBox)} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ))}
            </div>

            <p className="text-white text-sm leading-relaxed max-w-sm mx-auto">
              A circuit outline is shown — no labels, no clues.
              Pick the correct track from four options.
              Build a streak for bragging rights.
            </p>
            <button
              onClick={() => startQuestion()}
              className="px-8 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100 cursor-pointer"
            >
              Start
            </button>
          </motion.div>
        )}

        {/* ── QUESTION / ANSWERED ── */}
        {(phase === 'question' || phase === 'answered') && answer && (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Streak */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[#333333] text-xs font-mono uppercase tracking-widest">
                Which circuit is this?
              </p>
              {streak > 0 && (
                <span className="text-[#d4a017] text-xs font-mono font-bold">
                  {streak} streak
                </span>
              )}
            </div>

            {/* Circuit silhouette */}
            <motion.div
              className="rounded-2xl border bg-[#080808] transition-colors duration-300"
              style={{
                borderColor:
                  phase === 'answered'
                    ? isCorrect ? 'rgba(56,176,0,0.3)' : 'rgba(232,0,45,0.3)'
                    : '#1a1a1a',
              }}
            >
              <CircuitSilhouette circuit={answer} flash={flash} />
            </motion.div>

            {/* Options grid */}
            <div className="grid grid-cols-2 gap-2">
              {options.map(opt => {
                const isSelected = selected === opt.id
                const isAnswer = opt.id === answer.id
                const showCorrect = phase === 'answered' && isAnswer
                const showWrong = phase === 'answered' && isSelected && !isAnswer

                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={phase === 'answered'}
                    whileTap={phase === 'question' ? { scale: 0.97 } : {}}
                    className={[
                      'px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 text-left cursor-pointer disabled:cursor-default',
                      showCorrect
                        ? 'bg-[#0a1a08] border-[#38b000]/60 text-[#38b000]'
                        : showWrong
                        ? 'bg-[#1a0808] border-[#e8002d]/60 text-[#e8002d]'
                        : phase === 'answered'
                        ? 'bg-[#060606] border-[#111111] text-[#333333]'
                        : 'bg-[#0f0f0f] border-[#1a1a1a] text-white hover:border-[#d4a017]/40 hover:bg-[#0f0f08]',
                    ].join(' ')}
                  >
                    {opt.name}
                  </motion.button>
                )
              })}
            </div>

            {/* Post-answer fact + next */}
            <AnimatePresence>
              {phase === 'answered' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="rounded-xl border border-[#1a1a1a] bg-[#060606] px-5 py-4">
                    <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-2">
                      {isCorrect ? 'Correct!' : `It was ${answer.name}`}
                    </p>
                    <p className="text-white text-sm leading-relaxed">
                      {CIRCUIT_FACTS[answer.id] ?? `${answer.name} — ${answer.location}.`}
                    </p>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-[1.02] active:scale-100 cursor-pointer"
                  >
                    Next Track
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.totalPlayed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Best Streak', value: String(stats.bestStreak) },
            { label: 'Correct', value: String(stats.totalCorrect) },
            { label: 'Played', value: String(stats.totalPlayed) },
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
