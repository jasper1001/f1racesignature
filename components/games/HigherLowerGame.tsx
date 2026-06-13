'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HL_DRIVERS,
  HL_STATS,
  STAT_CONFIG,
  pickRound,
  type HLDriver,
  type HLStat,
} from '@/lib/games/higherLowerData'
import { Analytics } from '@/lib/analytics'

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
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstRound    = useRef(true)

  const [phase,      setPhase]      = useState<Phase>('playing')
  const [driverA,    setDriverA]    = useState<HLDriver>(HL_DRIVERS[0])
  const [driverB,    setDriverB]    = useState<HLDriver>(HL_DRIVERS[1])
  const [stat,       setStat]       = useState<HLStat>('wins')
  const [streak,     setStreak]     = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [isCorrect,  setIsCorrect]  = useState<boolean | null>(null)
  const [copied,     setCopied]     = useState(false)

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
    if (isCorrect) {
      startRound()
    } else {
      setPhase('over')
    }
  }

  function handlePlayAgain() {
    Analytics.hlPlayAgain()
    setStreak(0)
    firstRound.current = true
    startRound()
  }

  async function handleShare() {
    Analytics.hlShareClicked(streak)
    const rating = getRating(streak)
    const text = `🏎️ Higher or Lower: F1 Edition\nStreak: ${streak} — ${rating}\nTest your F1 knowledge at racesignature.com/games/higher-lower`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ text, title: 'Higher or Lower: F1 Edition' }) } catch {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {}
    }
  }

  if (phase === 'over') {
    return (
      <EndScreen
        streak={streak}
        bestStreak={bestStreak}
        onPlayAgain={handlePlayAgain}
        onShare={handleShare}
        copied={copied}
      />
    )
  }

  const aVal     = driverA[stat] as number
  const bVal     = driverB[stat] as number
  const bIsHigher = bVal > aVal
  const winner   = bIsHigher ? driverB : driverA

  return (
    <div className="w-full">
      {/* Streak header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-white text-[10px] font-mono uppercase tracking-widest">Streak</span>
          <motion.span
            key={streak}
            initial={{ scale: 1.4, color: '#d4a017' }}
            animate={{ scale: 1,   color: '#d4a017' }}
            transition={{ duration: 0.25 }}
            className="text-[#d4a017] text-2xl font-mono font-bold"
          >
            {streak}
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-[10px] font-mono uppercase tracking-widest">Best</span>
          <span className="text-white text-2xl font-mono font-bold">{bestStreak}</span>
        </div>
      </div>

      {/* Stat badge */}
      <div className="text-center mb-5">
        <motion.span
          key={stat}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1.5 rounded-full border border-[#d4a017]/25 bg-[#d4a017]/10 text-[#d4a017] text-xs font-mono uppercase tracking-wider"
        >
          {STAT_CONFIG[stat]}
        </motion.span>
      </div>

      {/* Head-to-head cards */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Driver A — stat always visible */}
        <motion.div
          key={`a-${driverA.id}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 rounded-2xl border border-[#1a1a1a] bg-[#080808] p-6 flex flex-col items-center justify-center text-center"
          style={{ minHeight: 168 }}
        >
          <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3">Driver A</p>
          <p
            className="text-white text-xl font-semibold leading-snug mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {driverA.name}
          </p>
          <p className="text-[#d4a017] text-4xl font-mono font-bold">{aVal}</p>
        </motion.div>

        {/* VS separator */}
        <div className="flex md:flex-col items-center justify-center gap-1.5 py-2 md:py-0 md:px-2">
          <div className="hidden md:block w-px flex-1 bg-[#111111]" />
          <span className="text-white text-xs font-mono tracking-widest">VS</span>
          <div className="hidden md:block w-px flex-1 bg-[#111111]" />
        </div>

        {/* Driver B — stat hidden until reveal */}
        <motion.div
          key={`b-${driverB.id}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex-1 rounded-2xl border p-6 flex flex-col items-center justify-center text-center transition-colors duration-500 ${
            phase === 'revealing'
              ? isCorrect
                ? 'border-[#38b000]/40 bg-[#0a1f0a]'
                : 'border-[#cc4444]/40 bg-[#1a0808]'
              : 'border-[#1a1a1a] bg-[#080808]'
          }`}
          style={{ minHeight: 168 }}
        >
          <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3">Driver B</p>
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
                exit={{ opacity: 0, scale: 0.7 }}
                className="text-white/20 text-4xl font-mono font-bold"
              >
                ?
              </motion.p>
            ) : (
              <motion.p
                key="revealed"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={`text-4xl font-mono font-bold ${isCorrect ? 'text-[#38b000]' : 'text-[#cc4444]'}`}
              >
                {bVal}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Reveal feedback + fun fact */}
      <AnimatePresence>
        {phase === 'revealing' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 space-y-3"
          >
            {/* Result line */}
            <div className={`rounded-xl border p-4 text-center ${
              isCorrect
                ? 'border-[#38b000]/25 bg-[#0a1f0a]'
                : 'border-[#cc4444]/25 bg-[#1a0808]'
            }`}>
              <p className={`text-sm font-semibold mb-1 ${isCorrect ? 'text-[#38b000]' : 'text-[#cc4444]'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Wrong!'}
              </p>
              <p className="text-white text-sm">
                <span className="font-semibold">{driverB.name}</span> has{' '}
                <span className="font-semibold">{bVal > aVal ? 'more' : 'fewer'}</span>{' '}
                {STAT_CONFIG[stat].toLowerCase()} than{' '}
                <span className="font-semibold">{driverA.name}</span>{' '}
                <span className="text-white/60">({aVal} vs {bVal})</span>
              </p>
            </div>

            {/* Fun fact */}
            <div className="rounded-xl border border-[#1a1a1a] bg-[#080808] p-4">
              <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-1.5">
                Did you know?
              </p>
              <p className="text-white text-sm leading-relaxed">{winner.fact}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {phase === 'playing' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleGuess('higher')}
            className="py-4 rounded-xl border border-[#1a1a1a] bg-[#080808] text-white font-semibold text-lg hover:border-[#38b000]/40 hover:bg-[#0a1f0a] active:scale-95 transition-all"
          >
            ↑ Higher
          </button>
          <button
            onClick={() => handleGuess('lower')}
            className="py-4 rounded-xl border border-[#1a1a1a] bg-[#080808] text-white font-semibold text-lg hover:border-[#cc4444]/40 hover:bg-[#1a0808] active:scale-95 transition-all"
          >
            ↓ Lower
          </button>
        </div>
      )}

      {phase === 'revealing' && (
        <button
          onClick={skipReveal}
          className="w-full py-4 rounded-xl bg-[#d4a017] text-black font-semibold hover:bg-[#e8b84b] active:scale-95 transition-all"
        >
          {isCorrect ? 'Next Round →' : 'See Results →'}
        </button>
      )}
    </div>
  )
}

// ── End screen ────────────────────────────────────────────────────────────────

function EndScreen({
  streak,
  bestStreak,
  onPlayAgain,
  onShare,
  copied,
}: {
  streak: number
  bestStreak: number
  onPlayAgain: () => void
  onShare: () => void
  copied: boolean
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
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden mb-4">
        <div className="px-6 py-5 text-center border-b border-[#111111]">
          <p className="text-[#cc4444] text-[10px] font-mono uppercase tracking-widest mb-3">Game Over</p>
          <p className="text-white text-6xl font-mono font-bold mb-1">{streak}</p>
          <p className="text-white text-sm font-mono mb-4">Streak</p>
          <span className="inline-block px-4 py-2 rounded-full border border-[#d4a017]/30 bg-[#d4a017]/10 text-[#d4a017] text-sm font-mono">
            {rating}
          </span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 divide-x divide-[#111111]">
          <div className="px-4 py-4 text-center">
            <p className="text-white text-[10px] font-mono uppercase tracking-wider mb-1">Best</p>
            <p className="text-white text-xl font-mono font-bold">{bestStreak}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-white text-[10px] font-mono uppercase tracking-wider mb-1">Games</p>
            <p className="text-white text-xl font-mono font-bold">{persist.totalGames}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-white text-[10px] font-mono uppercase tracking-wider mb-1">Correct</p>
            <p className="text-white text-xl font-mono font-bold">{persist.totalCorrect}</p>
          </div>
        </div>
      </div>

      {/* Rating scale */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5 mb-4">
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3">Ratings</p>
        <div className="space-y-1.5">
          {[
            { label: 'Backmarker',         range: '0–2' },
            { label: 'Midfield Fighter',   range: '3–5' },
            { label: 'Points Finisher',    range: '6–10' },
            { label: 'Podium Contender',   range: '11–15' },
            { label: 'World Champion Brain', range: '16+' },
          ].map(r => (
            <div key={r.label} className={`flex items-center justify-between text-sm ${r.label === rating ? '' : 'opacity-40'}`}>
              <span className={r.label === rating ? 'text-[#d4a017] font-semibold' : 'text-white'}>
                {r.label === rating ? '▶ ' : ''}{r.label}
              </span>
              <span className="text-white font-mono text-xs">{r.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onShare}
          className="w-full py-3.5 rounded-xl border border-[#1a1a1a] bg-[#080808] text-white font-medium hover:border-[#2a2a2a] active:scale-95 transition-all"
        >
          {copied ? '✓ Copied to clipboard!' : '↗ Share Result'}
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 rounded-xl bg-[#d4a017] text-black font-semibold hover:bg-[#e8b84b] active:scale-95 transition-all"
        >
          Play Again
        </button>
      </div>
    </motion.div>
  )
}
