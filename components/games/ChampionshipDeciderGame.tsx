'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SCENARIOS, getRating, type Scenario, type StrategyOption, type ResultType } from '@/lib/games/strategyScenarios'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Leaderboard } from '@/components/games/Leaderboard'

const STATS_KEY = 'f1rs_games_strategy'

interface Stats {
  bestScore: number
  gamesPlayed: number
  lastPlayedDate: string
  bestRating: string
}

function loadStats(): Stats {
  if (typeof window === 'undefined') return { bestScore: 0, gamesPlayed: 0, lastPlayedDate: '', bestRating: '' }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { bestScore: 0, gamesPlayed: 0, lastPlayedDate: '', bestRating: '' }
  } catch { return { bestScore: 0, gamesPlayed: 0, lastPlayedDate: '', bestRating: '' } }
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

const RESULT_STYLES: Record<ResultType, { bg: string; border: string; color: string }> = {
  'Perfect Call':           { bg: '#e6f0e0', border: 'rgba(56,176,0,0.45)',   color: '#2e7d00' },
  'Smart but Risky':        { bg: '#f5edd2', border: 'rgba(212,160,23,0.5)',  color: '#9a7209' },
  'Understandable Mistake': { bg: '#f7e8db', border: 'rgba(255,140,0,0.5)',   color: '#c4690a' },
  'Strategy Disaster':      { bg: '#f7e3e3', border: 'rgba(232,0,45,0.45)',   color: '#c4122f' },
}

type Phase = 'idle' | 'question' | 'answered' | 'finished'

export function ChampionshipDeciderGame() {
  const [phase, setPhase]               = useState<Phase>('idle')
  const [scenarios, setScenarios]       = useState<Scenario[]>([])
  const [index, setIndex]               = useState(0)
  const [selected, setSelected]         = useState<StrategyOption | null>(null)
  const [score, setScore]               = useState(0)
  const [perfectCalls, setPerfectCalls] = useState(0)
  const [finalScore, setFinalScore]     = useState(0)
  const [finalPerfect, setFinalPerfect] = useState(0)
  const [isNewBest, setIsNewBest]       = useState(false)
  const [stats, setStats]               = useState<Stats>(loadStats)
  const gameRef = useRef<HTMLDivElement>(null)

  const startGame = useCallback(() => {
    const el = gameRef.current
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    const shuffled = shuffle(SCENARIOS)
    setScenarios(shuffled)
    setIndex(0)
    setScore(0)
    setPerfectCalls(0)
    setSelected(null)
    setFinalScore(0)
    setFinalPerfect(0)
    setIsNewBest(false)
    setPhase('question')
  }, [])

  const handleSelect = useCallback((option: StrategyOption) => {
    if (phase !== 'question') return
    setSelected(option)
    setScore(s => s + option.score)
    if (option.resultType === 'Perfect Call') setPerfectCalls(n => n + 1)
    setPhase('answered')
  }, [phase])

  const handleNext = useCallback(() => {
    const isLast = index >= scenarios.length - 1
    if (isLast) {
      const newBest = score > stats.bestScore
      const rating = getRating(score)
      const newStats: Stats = {
        bestScore: Math.max(stats.bestScore, score),
        gamesPlayed: stats.gamesPlayed + 1,
        lastPlayedDate: new Date().toISOString().split('T')[0],
        bestRating: newBest ? rating.label : (stats.bestRating || rating.label),
      }
      setFinalScore(score)
      setFinalPerfect(perfectCalls)
      setIsNewBest(newBest)
      setStats(newStats)
      saveStats(newStats)
      setPhase('finished')
    } else {
      setIndex(i => i + 1)
      setSelected(null)
      setPhase('question')
    }
  }, [index, scenarios.length, score, perfectCalls, stats])

  const current = scenarios[index]
  const total   = scenarios.length

  return (
    <div ref={gameRef} className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5"
          >
            <div className="w-12 h-12 mx-auto rounded-full border border-[#d4a017]/40 bg-[#f7efd6] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18V9l9-6 9 6v9" />
                <path d="M9 18V12h6v6" />
              </svg>
            </div>
            <p className="text-[#1a1712] text-sm leading-relaxed max-w-sm mx-auto">
              {SCENARIOS.length} real F1 strategy moments. One decision each.
              Make the call from the pit wall and see how you score against history.
            </p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs font-mono">
              <span style={{ color: RESULT_STYLES['Perfect Call'].color }}>● Perfect Call = 100 pts</span>
              <span style={{ color: RESULT_STYLES['Smart but Risky'].color }}>● Smart but Risky = 75 pts</span>
              <span style={{ color: RESULT_STYLES['Understandable Mistake'].color }}>● Understandable Mistake = 50 pts</span>
              <span style={{ color: RESULT_STYLES['Strategy Disaster'].color }}>● Strategy Disaster = 0 pts</span>
            </div>
            <button onClick={startGame}
              className="px-8 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100 cursor-pointer"
            >
              Start Strategy Quiz
            </button>
          </motion.div>
        )}

        {/* ── QUESTION / ANSWERED ── */}
        {(phase === 'question' || phase === 'answered') && current && (
          <motion.div
            key={`q-${index}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Progress + running score */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[#1a1712]/65 text-xs font-mono">Scenario {index + 1} of {total}</span>
              <span className="text-[#d4a017] text-xs font-mono font-bold">{score} pts</span>
            </div>
            <div className="h-0.5 bg-[#ece6d9] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#d4a017] rounded-full"
                animate={{ width: `${(index / total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* 2-col on desktop */}
            <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">
              {/* Left: Scenario card */}
              <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] overflow-hidden">
                <div className="border-b border-[#e2dccd] px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-1.5">
                        {current.grandPrix} · {current.year}
                      </p>
                      <h3 className="text-[#1a1712] text-lg font-semibold" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                        {current.title}
                      </h3>
                      <p className="text-[#1a1712] text-xs mt-1 opacity-50">{current.subtitle}</p>
                    </div>
                    <p className="text-[#1a1712] text-[10px] font-mono shrink-0 text-right leading-relaxed opacity-30">
                      {current.lap}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest">{current.role}</p>
                  <ul className="space-y-2">
                    {current.context.map((line, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[#1a1712] text-sm leading-relaxed">
                        <span className="text-[#1a1712] mt-0.5 shrink-0 text-base leading-none opacity-20">›</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-[#e2dccd] px-5 py-3">
                  <p className="text-[#1a1712] text-sm font-medium">{current.question}</p>
                </div>
              </div>

              {/* Right: Answer options + result reveal */}
              <div className="space-y-3">
                <div className="space-y-2">
                  {current.options.map(opt => {
                    const isSelected = selected?.id === opt.id
                    const rs = RESULT_STYLES[opt.resultType]
                    return (
                      <motion.button
                        key={opt.id}
                        onClick={() => handleSelect(opt)}
                        disabled={phase === 'answered'}
                        whileTap={phase === 'question' ? { scale: 0.98 } : {}}
                        className={[
                          'w-full px-4 py-3 rounded-xl text-sm text-left border transition-all duration-200 cursor-pointer disabled:cursor-default',
                          phase === 'answered' && isSelected
                            ? ''
                            : phase === 'answered'
                            ? 'bg-[#f3eee3] border-[#e2dccd] text-[#1a1712]/65'
                            : 'bg-[#ffffff] border-[#dcd5c6] text-[#1a1712] hover:border-[#d4a017]/40 hover:bg-[#f7efd6]',
                        ].join(' ')}
                        style={
                          phase === 'answered' && isSelected
                            ? { background: rs.bg, borderColor: rs.border, color: rs.color }
                            : {}
                        }
                      >
                        {opt.text}
                      </motion.button>
                    )
                  })}
                </div>

                <AnimatePresence>
                  {phase === 'answered' && selected && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                      <div className="rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] px-5 py-4 space-y-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold"
                            style={{
                              background: RESULT_STYLES[selected.resultType].bg,
                              color:      RESULT_STYLES[selected.resultType].color,
                              border:     `1px solid ${RESULT_STYLES[selected.resultType].border}`,
                            }}
                          >
                            {selected.resultType}
                          </span>
                          <span className="text-[#d4a017] text-xs font-mono">+{selected.score} pts</span>
                        </div>
                        <p className="text-[#1a1712] text-sm leading-relaxed">{selected.explanation}</p>
                        <div className="border-t border-[#e2dccd] pt-3">
                          <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-1.5">What actually happened</p>
                          <p className="text-[#1a1712] text-sm leading-relaxed opacity-60">{current.actualOutcome}</p>
                        </div>
                        <div className="border-t border-[#e2dccd] pt-3">
                          <p className="text-[#1a1712] text-[10px] font-mono uppercase tracking-widest mb-1.5 opacity-30">Did you know?</p>
                          <p className="text-[#1a1712] text-xs leading-relaxed opacity-40">{current.didYouKnow}</p>
                        </div>
                      </div>
                      <button onClick={handleNext}
                        className="w-full px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-[1.02] active:scale-100 cursor-pointer"
                      >
                        {index >= scenarios.length - 1 ? 'See Final Score' : 'Next Scenario'}
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
          const rating = getRating(finalScore)
          const maxScore = SCENARIOS.length * 100
          return (
            <motion.div key="finished" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 space-y-6"
            >
              {isNewBest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="flex justify-center"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-full text-[#d4a017] text-xs font-mono uppercase tracking-widest">
                    ★ New Personal Best
                  </span>
                </motion.div>
              )}

              <div className="text-center space-y-1">
                <p className="text-[#1a1712]/65 text-xs font-mono uppercase tracking-widest">Final Score</p>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.08 }}
                >
                  <span className="text-6xl font-bold font-mono" style={{ color: rating.color }}>{finalScore}</span>
                  <span className="text-2xl text-[#1a1712]/65 font-mono"> / {maxScore}</span>
                </motion.div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xl font-semibold" style={{ color: rating.color }}>{rating.label}</p>
                <p className="text-[#1a1712] text-sm">{rating.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
                  <p className="text-xl font-mono font-bold" style={{ color: RESULT_STYLES['Perfect Call'].color }}>{finalPerfect}</p>
                  <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Perfect Calls</p>
                </div>
                <div className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
                  <p className="text-xl font-mono font-bold text-[#1a1712]">{stats.bestScore}</p>
                  <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Personal Best</p>
                </div>
              </div>

              <div className="space-y-3">
                <ShareButtons
                  text={`🏎️ Championship Decider Quiz\n${finalScore}/${SCENARIOS.length * 100} — ${rating.label}\nf1racesignature.site/games/championship-decider`}
                  url="https://f1racesignature.site/games/championship-decider"
                />
                <button onClick={startGame}
                  className="w-full px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-[1.02] active:scale-100 cursor-pointer"
                >
                  Play Again
                </button>
                <a href="/games"
                  className="block w-full px-6 py-3 border border-[#dcd5c6] text-[#1a1712]/65 text-sm font-medium rounded-xl hover:border-[#c4bca8] hover:text-[#1a1712] transition-all text-center"
                >
                  Back to Mini Games
                </a>
                <Leaderboard gameId="championship-decider" score={finalScore} accent="#3b82f6" />
                <NextGameCard currentId="championship-decider" />
              </div>
            </motion.div>
          )
        })()}

      </AnimatePresence>

      {/* Stats bar — shown on idle if games have been played */}
      {phase === 'idle' && stats.gamesPlayed > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Best Score', value: String(stats.bestScore) },
            { label: 'Games',      value: String(stats.gamesPlayed) },
            { label: 'Best Rating', value: stats.bestRating || '—' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
              <p className="text-[#1a1712] text-sm font-mono font-bold truncate">{s.value}</p>
              <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
