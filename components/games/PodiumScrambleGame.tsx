'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Leaderboard } from '@/components/games/Leaderboard'
import {
  PODIUM_RACES, ROUNDS_PER_GAME, ratingFor, shuffle, composeScore,
  type PodiumRace,
} from '@/lib/games/podiumScrambleData'

const ACCENT = '#d4a017'
const STATS_KEY = 'f1rs_games_podium_scramble'
const MEDALS = ['🥇', '🥈', '🥉']

// An entry placed in the rostrum, carrying its true finishing index (0 = P1).
interface Item { driver: string; team: string; correctIdx: number }

interface Stats { best: number | null; gamesPlayed: number }
function loadStats(): Stats {
  if (typeof window === 'undefined') return { best: null, gamesPlayed: 0 }
  try { const r = localStorage.getItem(STATS_KEY); return r ? JSON.parse(r) : { best: null, gamesPlayed: 0 } }
  catch { return { best: null, gamesPlayed: 0 } }
}
function saveStats(s: Stats) {
  if (typeof window !== 'undefined') localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

function fmtTime(ms: number): string {
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}:${(s - m * 60).toFixed(0).padStart(2, '0')}`
}

// Build a scrambled arrangement that is never already perfect (no free rounds).
function scramble(race: PodiumRace): Item[] {
  const base: Item[] = race.podium.map((e, i) => ({ ...e, correctIdx: i }))
  let arr = shuffle(base)
  let guard = 0
  while (arr.every((it, i) => it.correctIdx === i) && guard++ < 12) arr = shuffle(base)
  return arr
}

function positionsOff(order: Item[]): number {
  return order.reduce((sum, it, i) => sum + Math.abs(i - it.correctIdx), 0)
}

type Phase = 'idle' | 'ordering' | 'revealed' | 'finished'

export function PodiumScrambleGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [queue, setQueue] = useState<PodiumRace[]>([])
  const [roundNum, setRoundNum] = useState(1)
  const [order, setOrder] = useState<Item[]>([])
  const [totalOff, setTotalOff] = useState(0)
  const [lastOff, setLastOff] = useState(0)
  const [finalOff, setFinalOff] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [finalMs, setFinalMs] = useState(0)
  const [isBest, setIsBest] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)

  const totalMs = useRef(0)
  const roundStart = useRef(0)
  const gameRef = useRef<HTMLDivElement>(null)

  const race = queue[roundNum - 1]

  const beginRound = useCallback((r: PodiumRace) => {
    setOrder(scramble(r))
    roundStart.current = Date.now()
    setPhase('ordering')
  }, [])

  const startGame = useCallback(() => {
    const el = gameRef.current
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72), behavior: 'smooth' })
    const picked = shuffle(PODIUM_RACES).slice(0, ROUNDS_PER_GAME)
    totalMs.current = 0
    setQueue(picked); setRoundNum(1); setTotalOff(0); setLastOff(0); setFinalOff(0); setIsBest(false)
    beginRound(picked[0])
  }, [beginRound])

  const move = useCallback((i: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  const lockIn = useCallback(() => {
    if (phase !== 'ordering') return
    totalMs.current += Date.now() - roundStart.current
    const off = positionsOff(order)
    setLastOff(off)
    setTotalOff((t) => t + off)
    setPhase('revealed')
  }, [phase, order])

  const next = useCallback(() => {
    if (roundNum >= ROUNDS_PER_GAME) {
      const off = totalOff
      const score = composeScore(off, totalMs.current)
      const best = stats.best === null || score < stats.best
      const ns: Stats = { best: best ? score : stats.best, gamesPlayed: stats.gamesPlayed + 1 }
      setFinalOff(off); setFinalScore(score); setFinalMs(totalMs.current); setIsBest(best)
      setStats(ns); saveStats(ns); setPhase('finished')
    } else {
      const n = roundNum + 1
      setRoundNum(n)
      beginRound(queue[n - 1])
    }
  }, [roundNum, totalOff, totalMs, stats, queue, beginRound])

  return (
    <div ref={gameRef} className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5">
            <div className="text-5xl">🥇</div>
            <p className="text-[#1a1712] text-sm leading-relaxed max-w-sm mx-auto">
              A famous race, its podium scrambled. Reorder the three drivers into the
              correct <strong>finishing order</strong> — P1, P2, P3. {ROUNDS_PER_GAME} races,
              fewest positions off wins. Quick fingers break ties.
            </p>
            <button onClick={startGame}
              className="px-8 py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 hover:scale-105 active:scale-100"
              style={{ background: ACCENT }}>
              Start
            </button>
          </motion.div>
        )}

        {/* ── ORDERING / REVEALED ── */}
        {(phase === 'ordering' || phase === 'revealed') && race && (
          <motion.div key="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            <div className="flex items-center justify-between px-1">
              <p className="text-[#1a1712] text-xs font-mono uppercase tracking-widest">Order the podium</p>
              <span className="text-[#1a1712]/65 text-xs font-mono">{roundNum} / {ROUNDS_PER_GAME}</span>
            </div>
            <div className="h-0.5 bg-[#ece6d9] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: ACCENT }}
                initial={{ width: `${((roundNum - 1) / ROUNDS_PER_GAME) * 100}%` }}
                animate={{ width: `${(roundNum / ROUNDS_PER_GAME) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>

            <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-5 space-y-4">
              <div className="text-center">
                <p className="text-[#1a1712] text-base font-semibold">{race.gp}</p>
                <p className="text-[#1a1712]/60 text-xs font-mono mt-0.5">{race.year}</p>
              </div>

              <div className="space-y-2">
                {(phase === 'ordering' ? order : [...order].sort((a, b) => a.correctIdx - b.correctIdx)).map((it, i) => {
                  const correct = phase === 'revealed' && it.correctIdx === i
                  return (
                    <div key={it.driver}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor: phase === 'revealed' ? (correct ? `${ACCENT}80` : '#e2dccd') : '#dcd5c6',
                        background: phase === 'revealed' && correct ? `${ACCENT}14` : '#ffffff',
                      }}>
                      <span className="text-xl w-7 text-center">{MEDALS[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#1a1712] text-sm font-semibold truncate">{it.driver}</p>
                        <p className="text-[#1a1712]/55 text-[11px] font-mono truncate">{it.team}</p>
                      </div>
                      {phase === 'ordering' ? (
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
                            className="px-2 leading-none text-[#1a1712] rounded-md border border-[#dcd5c6] bg-white hover:bg-[#f4f1ea] disabled:opacity-25 disabled:cursor-default active:scale-90 transition-all">
                            ▲
                          </button>
                          <button onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="Move down"
                            className="px-2 leading-none text-[#1a1712] rounded-md border border-[#dcd5c6] bg-white hover:bg-[#f4f1ea] disabled:opacity-25 disabled:cursor-default active:scale-90 transition-all">
                            ▼
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-mono" style={{ color: correct ? ACCENT : '#b91c1c' }}>
                          {correct ? '✓' : `was P${it.correctIdx + 1}`}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {phase === 'ordering' ? (
                <button onClick={lockIn}
                  className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: ACCENT }}>
                  Lock It In
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest">This race</p>
                      <p className="font-mono font-bold" style={{ color: lastOff === 0 ? ACCENT : '#1a1712' }}>
                        {lastOff === 0 ? 'Perfect' : `${lastOff} off`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#1a1712]/55 text-[10px] font-mono uppercase tracking-widest">Total off</p>
                      <p className="font-mono font-bold text-[#1a1712]">{totalOff}</p>
                    </div>
                  </div>
                  <p className="text-[#1a1712] text-xs leading-relaxed text-center px-2">{race.note}</p>
                  <button onClick={next}
                    className="w-full py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: ACCENT }}>
                    {roundNum >= ROUNDS_PER_GAME ? 'See Results' : 'Next Race'}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── FINISHED ── */}
        {phase === 'finished' && (() => {
          const rt = ratingFor(finalOff)
          return (
            <motion.div key="finished" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center space-y-5">
              {isBest && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest"
                  style={{ color: ACCENT, background: `${ACCENT}1a`, border: `1px solid ${ACCENT}50` }}>
                  ★ New Personal Best
                </motion.div>
              )}
              <div>
                <p className="text-[#1a1712]/65 text-xs font-mono uppercase tracking-widest mb-3">Positions off ({ROUNDS_PER_GAME} races)</p>
                <motion.p initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.08 }}
                  className="text-6xl font-bold font-mono" style={{ color: rt.color }}>
                  {finalOff}
                </motion.p>
                <p className="text-[#1a1712]/55 text-xs font-mono mt-2">in {fmtTime(finalMs)}</p>
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: rt.color }}>{rt.label}</p>
                <p className="text-[#1a1712] text-sm mt-1">{rt.sub}</p>
              </div>
              <div className="flex flex-col gap-3">
                <ShareButtons
                  text={`🥇 Podium Scramble\n${ROUNDS_PER_GAME} races, only ${finalOff} off — ${rt.label}\nf1racesignature.site/games/podium-scramble`}
                  url="https://f1racesignature.site/games/podium-scramble"
                />
                <button onClick={startGame}
                  className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 hover:scale-[1.02] active:scale-100"
                  style={{ background: ACCENT }}>
                  Play Again
                </button>
                <Leaderboard gameId="podium-scramble" score={finalScore} ascending accent={ACCENT} />
                <NextGameCard currentId="podium-scramble" />
              </div>
            </motion.div>
          )
        })()}

      </AnimatePresence>

      {/* Stats bar */}
      {stats.gamesPlayed > 0 && phase !== 'finished' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
            <p className="text-[#1a1712] text-base font-mono font-bold">{stats.best !== null ? Math.floor(stats.best) : '—'}</p>
            <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Best (off)</p>
          </div>
          <div className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
            <p className="text-[#1a1712] text-base font-mono font-bold">{stats.gamesPlayed}</p>
            <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Games</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
