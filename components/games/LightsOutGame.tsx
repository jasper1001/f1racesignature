'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareButtons } from '@/components/games/ShareButtons'

const LIGHT_INTERVAL = 800
const MIN_GO_DELAY = 200
const MAX_GO_DELAY = 3000
const STATS_KEY = 'f1rs_games_lightsout'

type Phase = 'intro' | 'countdown' | 'go' | 'false_start' | 'result'

interface Stats {
  personalBest: number | null
  attempts: number
  totalTime: number
}

function loadStats(): Stats {
  if (typeof window === 'undefined') return { personalBest: null, attempts: 0, totalTime: 0 }
  try {
    const raw = localStorage.getItem(STATS_KEY)
    return raw ? JSON.parse(raw) : { personalBest: null, attempts: 0, totalTime: 0 }
  } catch {
    return { personalBest: null, attempts: 0, totalTime: 0 }
  }
}

function saveStats(s: Stats) {
  if (typeof window !== 'undefined') localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

function getRating(ms: number) {
  if (ms < 180) return { label: 'Elite Reflexes', color: '#d4a017', sub: 'You have the reflexes of an F1 champion.' }
  if (ms < 251) return { label: 'F1 Driver Level', color: '#c0c0c0', sub: 'Fast enough to race at the top level.' }
  if (ms < 351) return { label: 'Great Reaction', color: '#cd7f32', sub: 'Quicker than most people on the planet.' }
  return { label: 'Keep Practicing', color: '#555555', sub: 'Every champion started somewhere.' }
}

function Sparks() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: 14 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i % 3 === 0 ? 6 : 4,
            height: i % 3 === 0 ? 6 : 4,
            left: `${8 + (i * 6.5) % 84}%`,
            top: '55%',
            background: i % 2 === 0 ? '#d4a017' : '#ffffff',
          }}
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{
            y: -(90 + (i % 4) * 35),
            x: ((i % 5) - 2) * 18,
            opacity: [1, 1, 0],
            scale: [1, 0.6, 0],
          }}
          transition={{
            duration: 0.7 + (i % 3) * 0.2,
            delay: (i % 4) * 0.06,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

export function LightsOutGame() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [litCount, setLitCount] = useState(0)
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats>(loadStats)
  const [isNewBest, setIsNewBest] = useState(false)
  const [showSparks, setShowSparks] = useState(false)

  const goTimeRef = useRef<number | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  useEffect(() => () => clearTimers(), [])

  const startGame = useCallback(() => {
    clearTimers()
    setLitCount(0)
    setReactionTime(null)
    setIsNewBest(false)
    setShowSparks(false)
    setPhase('countdown')
    goTimeRef.current = null

    for (let i = 1; i <= 5; i++) {
      timersRef.current.push(
        setTimeout(() => setLitCount(i), i * LIGHT_INTERVAL)
      )
    }

    const delay = 5 * LIGHT_INTERVAL + MIN_GO_DELAY + Math.random() * (MAX_GO_DELAY - MIN_GO_DELAY)
    timersRef.current.push(
      setTimeout(() => {
        setLitCount(0)
        setPhase('go')
        goTimeRef.current = performance.now()
      }, delay)
    )
  }, [])

  const handlePanelClick = useCallback(() => {
    if (phase === 'countdown') {
      clearTimers()
      setPhase('false_start')
      return
    }

    if (phase === 'go' && goTimeRef.current !== null) {
      const ms = Math.round(performance.now() - goTimeRef.current)
      setReactionTime(ms)

      const newStats: Stats = {
        personalBest: stats.personalBest === null ? ms : Math.min(stats.personalBest, ms),
        attempts: stats.attempts + 1,
        totalTime: stats.totalTime + ms,
      }

      const newBest = stats.personalBest === null || ms < stats.personalBest
      if (newBest) setIsNewBest(true)
      if (ms < 180) setShowSparks(true)

      setStats(newStats)
      saveStats(newStats)
      setPhase('result')
    }
  }, [phase, stats])

  const lights = Array.from({ length: 5 }, (_, i) => i < litCount)
  const avgTime = stats.attempts > 0 ? Math.round(stats.totalTime / stats.attempts) : null

  const isClickable = phase === 'countdown' || phase === 'go'

  return (
    <div className="select-none space-y-4">
      {/* Main panel */}
      <div
        onClick={isClickable ? handlePanelClick : undefined}
        className={[
          'relative rounded-2xl border p-8 md:p-12 flex flex-col items-center gap-8 transition-all duration-300',
          phase === 'go'
            ? 'border-[#d4a017]/40 bg-[#0a0800] shadow-[0_0_40px_rgba(212,160,23,0.06)]'
            : 'border-[#1a1a1a] bg-[#080808]',
          isClickable ? 'cursor-pointer' : '',
        ].join(' ')}
      >
        {showSparks && <Sparks />}

        {/* Lights row */}
        <div className="flex items-center gap-4 md:gap-5">
          {lights.map((lit, i) => (
            <div key={i} className="relative">
              <motion.div
                animate={lit ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ duration: 0.12 }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 transition-all duration-100"
                style={{
                  background: lit ? '#cc0000' : '#140505',
                  borderColor: lit ? '#ff3300' : '#250a0a',
                  boxShadow: lit
                    ? '0 0 18px 5px rgba(204,0,0,0.55), 0 0 50px 14px rgba(204,0,0,0.2), inset 0 1px 2px rgba(255,120,120,0.4)'
                    : 'none',
                }}
              />
            </div>
          ))}
        </div>

        {/* State content */}
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-center"
            >
              <p className="text-white text-sm mb-6 max-w-xs leading-relaxed">
                Watch all five lights illuminate. The moment they go out â€” tap as fast as you can. Don&apos;t jump the start.
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); startGame() }}
                className="px-8 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100 cursor-pointer"
              >
                Start
              </button>
            </motion.div>
          )}

          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-[#555555] text-xs font-mono uppercase tracking-widest">Get readyâ€¦</p>
            </motion.div>
          )}

          {phase === 'go' && (
            <motion.div
              key="go"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="text-center"
            >
              <p className="text-[#d4a017] text-5xl font-bold font-mono tracking-widest">
                TAP!
              </p>
            </motion.div>
          )}

          {phase === 'false_start' && (
            <motion.div
              key="false_start"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-3"
            >
              <p className="text-[#e8002d] text-3xl font-bold font-mono tracking-wider">JUMP START!</p>
              <p className="text-white text-sm">You moved before the lights went out.</p>
              <button
                onClick={(e) => { e.stopPropagation(); startGame() }}
                className="mt-2 px-6 py-2.5 bg-[#111111] border border-[#222222] text-[#aaaaaa] text-sm rounded-xl hover:text-white hover:border-[#333333] transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {phase === 'result' && reactionTime !== null && (
            <ResultPanel
              ms={reactionTime}
              isNewBest={isNewBest}
              onPlayAgain={() => { startGame() }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Stats bar */}
      {stats.attempts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Best', value: stats.personalBest !== null ? `${stats.personalBest}ms` : 'â€”' },
            { label: 'Average', value: avgTime !== null ? `${avgTime}ms` : 'â€”' },
            { label: 'Attempts', value: String(stats.attempts) },
          ].map((s) => (
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

function ResultPanel({
  ms,
  isNewBest,
  onPlayAgain,
}: {
  ms: number
  isNewBest: boolean
  onPlayAgain: () => void
}) {
  const rating = getRating(ms)

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-4 w-full max-w-xs"
    >
      {isNewBest && (
        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 14 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4a017]/10 border border-[#d4a017]/30 rounded-full text-[#d4a017] text-xs font-mono uppercase tracking-widest"
        >
          â˜… New Personal Best
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.08 }}
        className="flex items-baseline justify-center gap-1"
      >
        <span className="text-6xl font-bold font-mono" style={{ color: rating.color }}>
          {ms}
        </span>
        <span className="text-xl text-white/30 font-mono">ms</span>
      </motion.div>

      <div>
        <p className="text-lg font-semibold" style={{ color: rating.color }}>
          {rating.label}
        </p>
        <p className="text-white text-sm mt-1">{rating.sub}</p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <ShareButtons
          text={`ðŸŽï¸ Lights Out â€” F1 Reaction Test\nâš¡ ${ms}ms â€” ${rating.label}\nf1racesignature.site/games/lights-out`}
          url="https://f1racesignature.site/games/lights-out"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onPlayAgain() }}
          className="w-full px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-[1.02] active:scale-100 cursor-pointer"
        >
          Play Again
        </button>
      </div>
    </motion.div>
  )
}

