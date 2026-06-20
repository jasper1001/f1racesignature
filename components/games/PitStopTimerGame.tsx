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
  if (release < target - cfg.safeOffset) return { label: 'Unsafe Release', subtitle: 'Car left the box too early — penalty risk.',             color: '#ef4444' }
  if (abs <= cfg.perfectWindow)           return { label: 'Perfect Stop',   subtitle: 'Championship-level precision.',                           color: '#22c55e' }
  if (abs <= cfg.greatWindow)             return { label: 'Great Release',   subtitle: 'Clean and fast — race position held.',                   color: '#84cc16' }
  if (abs <= cfg.solidWindow)             return { label: 'Solid Stop',      subtitle: diff > 0 ? 'A little late — time lost in box.' : 'Slightly rushed but safe.', color: '#f59e0b' }
  return                                         { label: 'Time Lost',       subtitle: 'Too long in the pit box — positions gone.',              color: '#f97316' }
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
      <div className="p-6 md:p-10">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: ACCENT }}>
            Pit Wall
          </p>
          <p className="text-white/75 text-sm">
            Can you release the car at the perfect moment?
          </p>
        </div>

        {/* 2-col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Left: difficulty + config */}
          <div className="space-y-5">
            <div>
              <p className="text-white/65 text-[10px] font-mono uppercase tracking-widest mb-2">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CONFIGS) as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      difficulty === d
                        ? 'text-white border-[#06b6d4]/50 bg-[#06b6d4]/10'
                        : 'text-white/65 border-[#141414] bg-[#080808] hover:text-white hover:border-[#222]'
                    }`}
                  >
                    {CONFIGS[d].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#111] bg-[#080808] p-4 space-y-3">
              {[
                { label: 'Target range',   value: `${cfg.targetMin.toFixed(2)}s – ${cfg.targetMax.toFixed(2)}s`, color: 'rgba(255,255,255,0.75)' },
                { label: 'Perfect window', value: `±${cfg.perfectWindow.toFixed(2)}s`,                            color: '#22c55e' },
                { label: 'Great window',   value: `±${cfg.greatWindow.toFixed(2)}s`,                              color: '#84cc16' },
                { label: 'Solid window',   value: `±${cfg.solidWindow.toFixed(2)}s`,                              color: '#f59e0b' },
                { label: 'Safe release',   value: `target − ${cfg.safeOffset.toFixed(2)}s min`,                   color: 'rgba(255,255,255,0.75)' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-xs">
                  <span className="text-white/65">{row.label}</span>
                  <span className="font-mono" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: rules + start */}
          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-3 text-sm text-white">
              <p className="text-white/65 text-[10px] font-mono uppercase tracking-widest mb-3">How to play</p>
              <p>A target stop time is shown. Start the timer and hit <span className="font-semibold">Release Car</span> as close to it as possible.</p>
              <p>Release too early → <span style={{ color: '#ef4444' }}>Unsafe Release</span>.</p>
              <p>Release too late → <span style={{ color: '#f97316' }}>Time Lost</span>.</p>
              <div className="pt-2 space-y-1.5 border-t border-[#111]">
                {[
                  { label: 'Perfect Stop',   color: '#22c55e' },
                  { label: 'Great Release',  color: '#84cc16' },
                  { label: 'Solid Stop',     color: '#f59e0b' },
                  { label: 'Time Lost',      color: '#f97316' },
                  { label: 'Unsafe Release', color: '#ef4444' },
                ].map(r => (
                  <div key={r.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="text-white/80">{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 rounded-2xl font-semibold text-black text-base transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: ACCENT }}
            >
              Start Pit Stop
            </button>
          </div>

        </div>
      </div>
    )
  }

  // ── Countdown ──────────────────────────────────────────────────────────────

  if (phase === 'countdown') {
    const isGo = countdown === 0
    return (
      <div className="flex flex-col items-center justify-center py-24 md:py-32 select-none">
        <p className="text-white/65 text-[10px] font-mono uppercase tracking-widest mb-8">Get ready</p>
        <div
          className="text-[120px] md:text-[160px] font-bold leading-none tabular-nums"
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
        className="flex flex-col items-center justify-center py-12 md:py-20 px-6 text-center select-none cursor-pointer"
        onClick={handleRelease}
      >
        {/* Target */}
        <p className="text-white/65 text-[10px] font-mono uppercase tracking-widest mb-1">Target Stop</p>
        <div
          className="font-bold tabular-nums mb-10"
          style={{ color: ACCENT, fontFamily: 'monospace', lineHeight: 1, fontSize: 'clamp(48px, 8vw, 80px)' }}
        >
          {fmt(target)}
        </div>

        {/* Live timer */}
        <p className="text-white/65 text-[10px] font-mono uppercase tracking-widest mb-3">Pit Stop Timer</p>
        <div
          className="font-bold text-white tabular-nums mb-12"
          style={{ fontFamily: 'monospace', lineHeight: 1, fontSize: 'clamp(72px, 14vw, 130px)' }}
        >
          {elapsed.toFixed(2)}
        </div>

        {/* Release button */}
        <button
          onClick={e => { e.stopPropagation(); handleRelease() }}
          className="w-full max-w-sm py-5 rounded-2xl font-bold text-white text-xl transition-all active:scale-[0.96]"
          style={{ background: '#b91c1c', boxShadow: '0 0 48px rgba(185,28,28,0.4)' }}
        >
          RELEASE CAR
        </button>
        <p className="text-white/65 text-[10px] font-mono uppercase tracking-widest mt-4">
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
      <div className="p-6 md:p-10">
        {/* Result heading */}
        <div className="mb-8 text-center md:text-left">
          <p
            className="text-3xl md:text-4xl font-bold mb-1"
            style={{ color: result.color, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {result.label}
          </p>
          <p className="text-white/70 text-sm">{result.subtitle}</p>
        </div>

        {/* 2-col on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Left: stats */}
          <div className="rounded-2xl border border-[#111] bg-[#080808] p-5 space-y-3 text-sm h-fit">
            {[
              { label: 'Target',       value: fmt(target),     color: 'white' },
              { label: 'Your release', value: fmt(releaseTime), color: 'white' },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-white/65">{row.label}</span>
                <span className="font-mono text-white">{row.value}</span>
              </div>
            ))}
            <div className="h-px bg-[#111]" />
            <div className="flex justify-between">
              <span className="text-white opacity-40">Difference</span>
              <span className="font-mono font-semibold" style={{ color: result.color }}>
                {diff >= 0 ? '+' : ''}{diff.toFixed(3)}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white opacity-40">Difficulty</span>
              <span className="text-white/75 font-mono">{cfg.label}</span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-col gap-3">
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
      </div>
    )
  }

  return null
}
