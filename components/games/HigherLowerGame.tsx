'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HL_DRIVERS,
  STAT_CONFIG,
  pickRound,
  type HLDriver,
  type HLStat,
} from '@/lib/games/higherLowerData'
import { Analytics } from '@/lib/analytics'
import { ShareButtons } from '@/components/games/ShareButtons'

// ── Persistence ───────────────────────────────────────────────────────────────

interface Persist {
  bestStreak: number
  totalGames: number
  totalCorrect: number
}

function loadPersist(): Persist {
  try {
    return JSON.parse(
      localStorage.getItem('hl_f1_persist') ??
      '{"bestStreak":0,"totalGames":0,"totalCorrect":0}',
    )
  } catch {
    return { bestStreak: 0, totalGames: 0, totalCorrect: 0 }
  }
}

function savePersist(s: Persist) {
  try { localStorage.setItem('hl_f1_persist', JSON.stringify(s)) } catch {}
}

// ── Rating ────────────────────────────────────────────────────────────────────

function getRating(n: number): string {
  if (n >= 16) return 'World Champion Brain'
  if (n >= 11) return 'Podium Contender'
  if (n >= 6)  return 'Points Finisher'
  if (n >= 3)  return 'Midfield Fighter'
  return 'Backmarker'
}

// ── Main component ────────────────────────────────────────────────────────────

type Phase = 'playing' | 'revealing' | 'over'

export function HigherLowerGame() {
  const recentPairsRef = useRef<Set<string>>(new Set())
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRound     = useRef(true)

  const [phase,      setPhase]      = useState<Phase>('playing')
  const [driverA,    setDriverA]    = useState<HLDriver>(HL_DRIVERS[0])
  const [driverB,    setDriverB]    = useState<HLDriver>(HL_DRIVERS[1])
  const [stat,       setStat]       = useState<HLStat>('wins')
  const [streak,     setStreak]     = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [isCorrect,  setIsCorrect]  = useState<boolean | null>(null)

  useEffect(() => {
    setBestStreak(loadPersist().bestStreak)
    startRound()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startRound() {
    let round = pickRound(recentPairsRef.current)
    if (!round) {
      recentPairsRef.current = new Set()
      round = pickRound(recentPairsRef.current)!
    }

    const pairKey = [round.driverA.id, round.driverB.id].sort().join('|')
    recentPairsRef.current.add(pairKey)
    if (recentPairsRef.current.size > 20) {
      const [oldest] = recentPairsRef.current
      recentPairsRef.current.delete(oldest)
    }

    setDriverA(round.driverA)
    setDriverB(round.driverB)
    setStat(round.stat)
    setIsCorrect(null)
    setPhase('playing')

    if (firstRound.current) {
      firstRound.current = false
      Analytics.hlGameStarted()
    }
  }

  function handleGuess(guess: 'higher' | 'lower') {
    if (phase !== 'playing') return

    const aVal = driverA[stat] as number
    const bVal = driverB[stat] as number
    if (aVal === bVal) { startRound(); return }

    const bIsHigher = bVal > aVal
    const correct   = guess === 'higher' ? bIsHigher : !bIsHigher

    setIsCorrect(correct)
    setPhase('revealing')

    Analytics.hlGuessSubmitted(stat, correct, streak + (correct ? 1 : 0))

    const saved = loadPersist()

    if (correct) {
      const newStreak = streak + 1
      setStreak(newStreak)
      const newBest = Math.max(saved.bestStreak, newStreak)
      setBestStreak(newBest)
      savePersist({ ...saved, totalGames: saved.totalGames + 1, totalCorrect: saved.totalCorrect + 1, bestStreak: newBest })
      timerRef.current = setTimeout(startRound, 2500)
    } else {
      savePersist({ ...saved, totalGames: saved.totalGames + 1 })
      Analytics.hlGameOver(streak, Math.max(saved.bestStreak, streak))
      timerRef.current = setTimeout(() => setPhase('over'), 2500)
    }
  }

  function skipReveal() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isCorrect) startRound()
    else setPhase('over')
  }

  function handlePlayAgain() {
    Analytics.hlPlayAgain()
    setStreak(0)
    firstRound.current = true
    startRound()
  }

  if (phase === 'over') {
    return (
      <EndScreen
        streak={streak}
        bestStreak={bestStreak}
        onPlayAgain={handlePlayAgain}
      />
    )
  }

  const aVal    = driverA[stat] as number
  const bVal    = driverB[stat] as number
  const winner  = bVal > aVal ? driverB : driverA

  return (
    <div className="w-full">

      {/* ── Streak header ── */}
      <div className="flex items-center justify-between mb-6">
        {/* Streak */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            style={{ background: 'rgba(212,160,23,0.08)', borderColor: 'rgba(212,160,23,0.2)' }}
          >
            <span className="text-white text-[10px] font-mono uppercase tracking-widest">Streak</span>
            <motion.span
              key={streak}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="text-[#d4a017] text-xl font-mono font-bold tabular-nums"
            >
              {streak}
            </motion.span>
            {streak >= 3 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-base leading-none"
              >
                🔥
              </motion.span>
            )}
          </div>
        </div>
        {/* Best */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/8 bg-white/4">
          <span className="text-white text-[10px] font-mono uppercase tracking-widest">Best</span>
          <span className="text-white text-xl font-mono font-bold tabular-nums">{bestStreak}</span>
        </div>
      </div>

      {/* ── Stat badge ── */}
      <div className="text-center mb-5">
        <AnimatePresence mode="wait">
          <motion.span
            key={stat}
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="inline-block px-5 py-2 rounded-full text-sm font-mono font-semibold uppercase tracking-wider"
            style={{
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.3)',
              color: '#d4a017',
              boxShadow: '0 0 20px rgba(212,160,23,0.1)',
            }}
          >
            {STAT_CONFIG[stat]}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* ── Head-to-head cards ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">

        {/* Driver A */}
        <motion.div
          key={`a-${driverA.id}`}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 rounded-2xl border border-[#1f1f1f] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
          style={{
            minHeight: 188,
            background: 'linear-gradient(145deg, #0e0e0e 0%, #080808 100%)',
          }}
        >
          {/* Top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

          <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3 opacity-50">Driver A</p>
          <p
            className="text-white text-xl font-semibold leading-snug mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {driverA.name}
          </p>
          <motion.p
            key={`${driverA.id}-${stat}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#d4a017] text-5xl font-mono font-bold tabular-nums"
            style={{ textShadow: '0 0 24px rgba(212,160,23,0.35)' }}
          >
            {aVal}
          </motion.p>
        </motion.div>

        {/* VS badge */}
        <div className="flex md:flex-col items-center justify-center gap-2 py-2 md:py-0 md:px-1">
          <div className="hidden md:block w-px flex-1 bg-[#1a1a1a]" />
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(212,160,23,0.08)',
              border: '2px solid rgba(212,160,23,0.25)',
              boxShadow: '0 0 16px rgba(212,160,23,0.1)',
            }}
          >
            <span className="text-[#d4a017] font-mono font-bold text-xs tracking-widest">VS</span>
          </div>
          <div className="hidden md:block w-px flex-1 bg-[#1a1a1a]" />
        </div>

        {/* Driver B */}
        <motion.div
          key={`b-${driverB.id}`}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 rounded-2xl border p-6 flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-500"
          style={{
            minHeight: 188,
            background: phase === 'revealing'
              ? isCorrect
                ? 'linear-gradient(145deg, #0c1f0c 0%, #080808 100%)'
                : 'linear-gradient(145deg, #1f0c0c 0%, #080808 100%)'
              : 'linear-gradient(145deg, #0e0e0e 0%, #080808 100%)',
            borderColor: phase === 'revealing'
              ? isCorrect ? 'rgba(56,176,0,0.4)' : 'rgba(204,68,68,0.4)'
              : '#1f1f1f',
          }}
        >
          {/* Top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

          <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3 opacity-50">Driver B</p>
          <p
            className="text-white text-xl font-semibold leading-snug mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {driverB.name}
          </p>

          <AnimatePresence mode="wait">
            {phase === 'playing' ? (
              <motion.p
                key="hidden"
                exit={{ opacity: 0, scale: 0.6 }}
                className="text-5xl font-mono font-bold"
                style={{ color: 'rgba(255,255,255,0.12)' }}
              >
                ?
              </motion.p>
            ) : (
              <motion.p
                key="revealed"
                initial={{ opacity: 0, scale: 0.5, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                className="text-5xl font-mono font-bold tabular-nums"
                style={{
                  color: isCorrect ? '#38b000' : '#cc4444',
                  textShadow: isCorrect
                    ? '0 0 24px rgba(56,176,0,0.5)'
                    : '0 0 24px rgba(204,68,68,0.5)',
                }}
              >
                {bVal}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Reveal feedback ── */}
      <AnimatePresence>
        {phase === 'revealing' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-4 space-y-2.5"
          >
            {/* Result */}
            <div
              className="rounded-xl border p-4 text-center"
              style={{
                borderColor: isCorrect ? 'rgba(56,176,0,0.25)' : 'rgba(204,68,68,0.25)',
                background: isCorrect ? 'rgba(56,176,0,0.06)' : 'rgba(204,68,68,0.06)',
              }}
            >
              <p
                className="text-base font-bold mb-1"
                style={{ color: isCorrect ? '#38b000' : '#cc4444' }}
              >
                {isCorrect ? '✓ Correct!' : '✗ Wrong!'}
              </p>
              <p className="text-white text-sm">
                <span className="font-semibold">{driverB.name}</span> has{' '}
                <span className="font-semibold">{bVal > aVal ? 'more' : 'fewer'}</span>{' '}
                {STAT_CONFIG[stat].toLowerCase()} than{' '}
                <span className="font-semibold">{driverA.name}</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>({aVal} vs {bVal})</span>
              </p>
            </div>

            {/* Fun fact */}
            <div className="rounded-xl border border-[#1a1a1a] bg-[#080808] p-4 relative overflow-hidden">
              <span
                className="absolute top-1 left-3 font-serif text-5xl leading-none select-none pointer-events-none"
                style={{ color: 'rgba(212,160,23,0.12)' }}
              >
                "
              </span>
              <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-1.5 pl-2">Did you know?</p>
              <p className="text-white text-sm leading-relaxed pl-2">{winner.fact}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action buttons ── */}
      {phase === 'playing' && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={() => handleGuess('higher')}
            className="py-5 rounded-xl font-bold text-lg text-white active:scale-95 transition-all duration-150 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              boxShadow: '0 4px 24px rgba(22,163,74,0.3)',
            }}
          >
            <span className="relative z-10">↑ Higher</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </button>
          <button
            onClick={() => handleGuess('lower')}
            className="py-5 rounded-xl font-bold text-lg text-white active:scale-95 transition-all duration-150 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              boxShadow: '0 4px 24px rgba(220,38,38,0.3)',
            }}
          >
            <span className="relative z-10">↓ Lower</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </button>
        </div>
      )}

      {phase === 'revealing' && (
        <button
          onClick={skipReveal}
          className="w-full py-4 rounded-xl font-semibold text-black active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #d4a017 0%, #e8b84b 100%)',
            boxShadow: '0 4px 20px rgba(212,160,23,0.25)',
          }}
        >
          {isCorrect ? 'Next Round →' : 'See Results →'}
        </button>
      )}
    </div>
  )
}

// ── End screen ────────────────────────────────────────────────────────────────

const RATINGS = [
  { label: 'Backmarker',          range: '0–2'  },
  { label: 'Midfield Fighter',    range: '3–5'  },
  { label: 'Points Finisher',     range: '6–10' },
  { label: 'Podium Contender',    range: '11–15' },
  { label: 'World Champion Brain', range: '16+'  },
]

function EndScreen({
  streak,
  bestStreak,
  onPlayAgain,
}: {
  streak: number
  bestStreak: number
  onPlayAgain: () => void
}) {
  const rating  = getRating(streak)
  const persist = loadPersist()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Score card */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden mb-4 relative" style={{ background: 'linear-gradient(160deg, #0e0e0e 0%, #080808 100%)' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
        <div className="px-6 py-6 text-center border-b border-[#111111]">
          <p className="text-[#cc4444] text-[10px] font-mono uppercase tracking-widest mb-4">Game Over</p>
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
            className="text-white font-mono font-bold mb-1 tabular-nums"
            style={{ fontSize: '5rem', lineHeight: 1, textShadow: '0 0 40px rgba(212,160,23,0.2)' }}
          >
            {streak}
          </motion.p>
          <p className="text-white text-sm font-mono mb-5 opacity-60">Streak</p>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="inline-block px-5 py-2 rounded-full text-sm font-mono font-semibold"
            style={{
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.3)',
              color: '#d4a017',
              boxShadow: '0 0 20px rgba(212,160,23,0.1)',
            }}
          >
            {rating}
          </motion.span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#111111]">
          {[
            { label: 'Best',    value: bestStreak },
            { label: 'Games',   value: persist.totalGames },
            { label: 'Correct', value: persist.totalCorrect },
          ].map(s => (
            <div key={s.label} className="px-4 py-4 text-center">
              <p className="text-white text-[10px] font-mono uppercase tracking-wider mb-1 opacity-50">{s.label}</p>
              <p className="text-white text-xl font-mono font-bold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rating ladder */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5 mb-4">
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3 opacity-50">Rating Scale</p>
        <div className="space-y-2">
          {RATINGS.map(r => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-all"
              style={{
                background: r.label === rating ? 'rgba(212,160,23,0.08)' : 'transparent',
                border: `1px solid ${r.label === rating ? 'rgba(212,160,23,0.2)' : 'transparent'}`,
              }}
            >
              <span
                className="text-sm font-medium"
                style={{
                  color: r.label === rating ? '#d4a017' : 'rgba(255,255,255,0.3)',
                  fontWeight: r.label === rating ? 700 : 400,
                }}
              >
                {r.label === rating ? '▶ ' : ''}{r.label}
              </span>
              <span
                className="text-xs font-mono"
                style={{ color: r.label === rating ? '#d4a017' : 'rgba(255,255,255,0.2)' }}
              >
                {r.range}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <ShareButtons
          text={`🏎️ Higher or Lower: F1 Edition\nStreak: ${streak} — ${getRating(streak)}\nracesignature.com/games/higher-lower`}
          url="https://racesignature.com/games/higher-lower"
        />
        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 rounded-xl font-semibold text-black active:scale-95 transition-all"
          style={{
            background: 'linear-gradient(135deg, #d4a017 0%, #e8b84b 100%)',
            boxShadow: '0 4px 20px rgba(212,160,23,0.25)',
          }}
        >
          Play Again
        </button>
      </div>
    </motion.div>
  )
}
