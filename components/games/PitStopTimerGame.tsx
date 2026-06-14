'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ShareButtons } from '@/components/games/ShareButtons'

// ── Types ──────────────────────────────────────────────────────────────────────

type Difficulty = 'rookie' | 'pro' | 'elite'
type Phase = 'intro' | 'countdown' | 'running' | 'result'

interface DiffConfig {
  label: string
  targetMin: number
  targetMax: number
  perfectWindow: number
  greatWindow: number
  solidWindow: number
  safeOffset: number
}

interface Result {
  label: string
  subtitle: string
  color: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CONFIGS: Record<Difficulty, DiffConfig> = {
  rookie: { label: 'Rookie', targetMin: 2.80, targetMax: 3.50, perfectWindow: 0.08, greatWindow: 0.15, solidWindow: 0.35, safeOffset: 0.20 },
  pro:    { label: 'Pro',    targetMin: 2.20, targetMax: 2.80, perfectWindow: 0.05, greatWindow: 0.10, solidWindow: 0.25, safeOffset: 0.15 },
  elite:  { label: 'Elite',  targetMin: 1.80, targetMax: 2.40, perfectWindow: 0.03, greatWindow: 0.07, solidWindow: 0.15, safeOffset: 0.10 },
}

const ACCENT = '#06b6d4'

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeResult(release: number, target: number, cfg: DiffConfig): Result {
  const diff = release - target
  const abs = Math.abs(diff)
  if (release < target - cfg.safeOffset)  return { label: 'Unsafe Release', subtitle: 'Car left the box too early — penalty risk.',    color: '#ef4444' }
  if (abs <= cfg.perfectWindow)            return { label: 'Perfect Stop',   subtitle: 'Championship-level precision.',                  color: '#22c55e' }
  if (abs <= cfg.greatWindow)             return { label: 'Great Release',   subtitle: 'Clean and fast — race position held.',          color: '#84cc16' }
  if (abs <= cfg.solidWindow)             return { label: 'Solid Stop',      subtitle: diff > 0 ? 'A little late — time lost in box.' : 'Slightly rushed but safe.', color: '#f59e0b' }
  return                                         { label: 'Time Lost',       subtitle: 'Too long in the pit box — positions gone.',     color: '#f97316' }
}

function randomTarget(cfg: DiffConfig): number {
  const v = cfg.targetMin + Math.random() * (cfg.targetMax - cfg.targetMin)
  return Math.round(v * 100) / 100
}

function fmt(s: number): string {
  return s.toFixed(2) + 's'
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PitStopTimerGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('pro')
  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState(3)
  const [target, setTarget] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [releaseTime, setReleaseTime] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const startMsRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const releasedRef = useRef(false)

  const cfg = CONFIGS[difficulty]

  const tick = useCallback(() => {
    if (!startMsRef.current || releasedRef.current) return
    setElapsed((performance.now() - startMsRef.current) / 1000)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  function startGame() {
    setTarget(randomTarget(cfg))
    setElapsed(0)
    setReleaseTime(null)
    setResult(null)
    releasedRef.current = false
    setCountdown(3)
    setPhase('countdown')
  }

  function handleRelease() {
    if (phase !== 'running' || releasedRef.current) return
    releasedRef.current = true
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    const t = startMsRef.current ? (performance.now() - startMsRef.current) / 1000 : 0
    setElapsed(t)
    setReleaseTime(t)
    setResult(computeResult(t, target, cfg))
    setPhase('result')
  }

  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown > 0) {
      const id = setTimeout(() => setCountdown(c => c - 1), 900)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => setPhase('running'), 550)
    return () => clearTimeout(id)
  }, [phase, countdown])

  useEffect(() => {
    if (phase !== 'running') return
    startMsRef.current = performance.now()
    releasedRef.current = false
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [phase, tick])

  // ── Intro ──────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center px-4 py-12 max-w-sm mx-auto">
        <p className="text-[10px] font-mono uppercase tracking-widest mb-2 text-center" style={{ color: ACCENT }}>
          Pit Wall
        </p>
        <h2
          className="text-3xl text-white mb-2 text-center"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          Pit Stop Timer
        </h2>
        <p className="text-white text-sm mb-10 text-center opacity-50">
          Can you release the car at the perfect moment?
        </p>

        {/* Difficulty */}
        <div className="w-full mb-6">
          <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-2 opacity-20">Difficulty</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CONFIGS) as Difficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  difficulty === d
                    ? 'text-white border-[#06b6d4]/50 bg-[#06b6d4]/10'
                    : 'text-white border-[#141414] bg-[#070707] opacity-40 hover:opacity-70 hover:border-[#1f1f1f]'
                }`}
              >
                {CONFIGS[d].label}
              </button>
            ))}
          </div>
        </div>

        {/* Config card */}
        <div className="w-full rounded-xl border border-[#0f0f0f] bg-[#060606] p-4 mb-8 space-y-2.5">
          {[
            { label: 'Target range',   value: `${cfg.targetMin.toFixed(2)}s – ${cfg.targetMax.toFixed(2)}s`, color: 'rgba(255,255,255,0.4)' },
            { label: 'Perfect window', value: `±${cfg.perfectWindow.toFixed(2)}s`,                            color: '#22c55e' },
            { label: 'Great window',   value: `±${cfg.greatWindow.toFixed(2)}s`,                              color: '#84cc16' },
            { label: 'Safe release',   value: `target − ${cfg.safeOffset.toFixed(2)}s min`,                   color: 'rgba(255,255,255,0.4)' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center text-xs">
              <span className="text-white opacity-30">{row.label}</span>
              <span className="font-mono" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Rules */}
        <div className="w-full mb-10 space-y-2 text-sm text-white">
          <p>A target stop time is shown. Hit <span className="font-semibold">Release Car</span> as close to it as possible.</p>
          <p>
            Release too early →{' '}
            <span style={{ color: '#ef4444' }}>Unsafe Release</span>.{' '}
            Too late →{' '}
            <span style={{ color: '#f97316' }}>Time Lost</span>.
          </p>
        </div>

        <button
          onClick={startGame}
          className="w-full py-4 rounded-2xl font-semibold text-black text-base transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: ACCENT }}
        >
          Start Pit Stop
        </button>
      </div>
    )
  }

  // ── Countdown ──────────────────────────────────────────────────────────────

  if (phase === 'countdown') {
    const isGo = countdown === 0
    return (
      <div className="flex flex-col items-center justify-center min-h-[58vh] select-none">
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-8 opacity-20">Get ready</p>
        <div
          className="text-[108px] font-bold leading-none tabular-nums"
          style={{ fontFamily: 'monospace', color: isGo ? ACCENT : 'white' }}
        >
          {isGo ? 'GO' : countdown}
        </div>
      </div>
    )
  }

  // ── Running ────────────────────────────────────────────────────────────────

  if (phase === 'running') {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[58vh] px-6 text-center select-none cursor-pointer"
        onClick={handleRelease}
      >
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-1 opacity-30">Target Stop</p>
        <div
          className="text-[52px] font-bold tabular-nums mb-10"
          style={{ color: ACCENT, fontFamily: 'monospace', lineHeight: 1 }}
        >
          {fmt(target)}
        </div>

        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-2 opacity-20">Pit Stop Timer</p>
        <div
          className="text-[86px] font-bold text-white tabular-nums mb-14"
          style={{ fontFamily: 'monospace', lineHeight: 1 }}
        >
          {elapsed.toFixed(2)}
        </div>

        <button
          onClick={e => { e.stopPropagation(); handleRelease() }}
          className="w-full max-w-xs py-5 rounded-2xl font-bold text-white text-xl transition-all active:scale-[0.96]"
          style={{ background: '#b91c1c', boxShadow: '0 0 40px rgba(185,28,28,0.4)' }}
        >
          RELEASE CAR
        </button>
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mt-4 opacity-15">
          Tap anywhere to release
        </p>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────

  if (phase === 'result' && result && releaseTime !== null) {
    const diff = releaseTime - target
    const shareText = [
      `🏎️ Pit Stop Timer — ${result.label}`,
      `⏱ Target: ${fmt(target)} | Released: ${fmt(releaseTime)} (${diff >= 0 ? '+' : ''}${diff.toFixed(3)}s)`,
      `f1racesignature.site/games/pit-stop-timer`,
    ].join('\n')

    return (
      <div className="flex flex-col items-center px-4 py-10 text-center max-w-sm mx-auto">
        <p
          className="text-[33px] font-bold mb-1"
          style={{ color: result.color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          {result.label}
        </p>
        <p className="text-white text-sm mb-8 opacity-50">{result.subtitle}</p>

        <div className="w-full rounded-2xl border border-[#0f0f0f] bg-[#060606] p-5 mb-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white opacity-40">Target</span>
            <span className="text-white font-mono">{fmt(target)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white opacity-40">Your release</span>
            <span className="text-white font-mono">{fmt(releaseTime)}</span>
          </div>
          <div className="h-px bg-[#0c0c0c]" />
          <div className="flex justify-between">
            <span className="text-white opacity-40">Difference</span>
            <span className="font-mono font-semibold" style={{ color: result.color }}>
              {diff >= 0 ? '+' : ''}{diff.toFixed(3)}s
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white opacity-40">Difficulty</span>
            <span className="text-white opacity-50 font-mono">{cfg.label}</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          <ShareButtons text={shareText} url="https://f1racesignature.site/games/pit-stop-timer" />
          <button
            onClick={startGame}
            className="w-full py-3.5 rounded-2xl font-semibold text-black transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: ACCENT }}
          >
            Try Again
          </button>
          <button
            onClick={() => setPhase('intro')}
            className="w-full py-3 rounded-xl border border-[#141414] text-white text-sm opacity-40 hover:opacity-80 hover:border-[#252525] transition-all"
          >
            Change Difficulty
          </button>
        </div>
      </div>
    )
  }

  return null
}
