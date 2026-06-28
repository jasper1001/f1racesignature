'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Leaderboard } from '@/components/games/Leaderboard'
import { fetchCircuits } from '@/lib/data'
import type { Circuit } from '@/lib/types'

const ACCENT = '#84cc16'
const STATS_KEY = 'f1rs_games_track_builder'

// Each difficulty has its OWN leaderboard so times only race the same grid size.
type Difficulty = 'rookie' | 'pro' | 'elite'
const GRID: Record<Difficulty, number> = { rookie: 3, pro: 4, elite: 5 }
const LABEL: Record<Difficulty, string> = { rookie: 'Rookie · 3×3', pro: 'Pro · 4×4', elite: 'Elite · 5×5' }
// Pro keeps the base id; rookie/elite get their own board ids (game_config rows).
const BOARD_ID: Record<Difficulty, string> = {
  rookie: 'track-builder-rookie',
  pro: 'track-builder',
  elite: 'track-builder-elite',
}

type Phase = 'idle' | 'playing' | 'result'

// ── Geometry ─────────────────────────────────────────────────────────────────
interface Puzzle {
  circuit: Circuit
  n: number
  sqX: number
  sqY: number
  side: number
  cell: number
  stroke: number
  isEmpty: boolean[]   // per correct-tile index — true = no track in that cell
}

function pathPoints(path: string): { x: number; y: number }[] {
  const nums = path.match(/-?\d+\.?\d*/g)?.map(Number) ?? []
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] })
  return pts
}

// Split a circuit into an n×n square grid over its tight bounding box (padded),
// and flag which cells contain no track so they can be treated as interchangeable.
function buildPuzzle(circuit: Circuit, n: number): Puzzle {
  const pts = pathPoints(circuit.path)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) {
    if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x
    if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y
  }
  const bw = x1 - x0, bh = y1 - y0
  const side = Math.max(bw, bh) * 1.12        // square board with a little margin
  const sqX = x0 - (side - bw) / 2
  const sqY = y0 - (side - bh) / 2
  const cell = side / n

  // Walk the polyline (densified) and mark every cell a sample lands in.
  const occupied = new Set<number>()
  const mark = (x: number, y: number) => {
    const c = Math.floor((x - sqX) / cell)
    const r = Math.floor((y - sqY) / cell)
    if (r >= 0 && r < n && c >= 0 && c < n) occupied.add(r * n + c)
  }
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1]
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (cell * 0.2)))
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      mark(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
    }
  }
  const isEmpty = Array.from({ length: n * n }, (_, k) => !occupied.has(k))
  return { circuit, n, sqX, sqY, side, cell, stroke: side * 0.016, isEmpty }
}

// A board position is satisfied when its tile is the correct one, OR both the tile
// sitting there and the target tile are empty (so empties are interchangeable).
function isSolved(order: number[], isEmpty: boolean[]): boolean {
  return order.every((tile, pos) => tile === pos || (isEmpty[tile] && isEmpty[pos]))
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fmt(ms: number): string {
  return (ms / 1000).toFixed(2) + 's'
}

// ── Stats (per difficulty best time) ─────────────────────────────────────────
type Stats = Partial<Record<Difficulty, number>> & { played?: number }

function loadStats(): Stats {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}') } catch { return {} }
}
function saveStats(s: Stats) {
  if (typeof window !== 'undefined') localStorage.setItem(STATS_KEY, JSON.stringify(s))
}

// ── Component ────────────────────────────────────────────────────────────────
export function TrackBuilderGame() {
  const { data: circuitsMap = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })
  const circuits = useMemo(
    () => (Object.values(circuitsMap) as Circuit[]).filter((c) => !c.variant),
    [circuitsMap],
  )

  const [difficulty, setDifficulty] = useState<Difficulty>('pro')
  const [phase, setPhase] = useState<Phase>('idle')
  const [circuit, setCircuit] = useState<Circuit | null>(null)
  const [order, setOrder] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [finalMs, setFinalMs] = useState(0)
  const [isBest, setIsBest] = useState(false)
  const [stats, setStats] = useState<Stats>(loadStats)

  const startRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const gameRef = useRef<HTMLDivElement>(null)

  const n = GRID[difficulty]
  const puzzle = useMemo(
    () => (circuit ? buildPuzzle(circuit, n) : null),
    [circuit, n],
  )

  // Live timer while playing.
  useEffect(() => {
    if (phase !== 'playing') return
    const tick = () => {
      setElapsed(performance.now() - startRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [phase])

  const start = useCallback(() => {
    if (circuits.length === 0) return
    const pick = circuits[Math.floor(Math.random() * circuits.length)]
    const pz = buildPuzzle(pick, GRID[difficulty])
    let ord = shuffled(pz.n * pz.n)
    let guard = 0
    while (isSolved(ord, pz.isEmpty) && guard++ < 50) ord = shuffled(pz.n * pz.n)
    setCircuit(pick)
    setOrder(ord)
    setSelected(null)
    setMoves(0)
    setElapsed(0)
    setIsBest(false)
    startRef.current = performance.now()
    setPhase('playing')
    // Bring the board into view on small screens.
    requestAnimationFrame(() => {
      const el = gameRef.current
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 72
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
      }
    })
  }, [circuits, difficulty])

  const finish = useCallback((ms: number) => {
    setFinalMs(ms)
    const prev = stats[difficulty]
    const best = prev === undefined || ms < prev
    const next: Stats = { ...stats, [difficulty]: best ? ms : prev, played: (stats.played ?? 0) + 1 }
    setStats(next)
    saveStats(next)
    setIsBest(best)
    setPhase('result')
  }, [stats, difficulty])

  const tapTile = useCallback((pos: number) => {
    if (phase !== 'playing' || !puzzle) return
    if (selected === null) { setSelected(pos); return }
    if (selected === pos) { setSelected(null); return }
    const next = [...order];
    [next[selected], next[pos]] = [next[pos], next[selected]]
    setOrder(next)
    setSelected(null)
    setMoves((m) => m + 1)
    if (isSolved(next, puzzle.isEmpty)) finish(performance.now() - startRef.current)
  }, [phase, puzzle, selected, order, finish])

  // ── Loading ────────────────────────────────────────────────────────────────
  if (circuits.length === 0) {
    return (
      <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-8 text-center">
        <p className="text-[#1a1712]/65 text-sm font-mono">Loading circuits…</p>
      </div>
    )
  }

  // ── Tile renderer ────────────────────────────────────────────────────────────
  const renderTile = (pos: number) => {
    if (!puzzle) return null
    const tile = order[pos]               // which correct-cell index sits here
    const r = Math.floor(tile / puzzle.n)
    const c = tile % puzzle.n
    const vb = `${puzzle.sqX + c * puzzle.cell} ${puzzle.sqY + r * puzzle.cell} ${puzzle.cell} ${puzzle.cell}`
    const correct = tile === pos || (puzzle.isEmpty[tile] && puzzle.isEmpty[pos])
    const sel = selected === pos
    const solved = phase === 'result'
    return (
      <button
        key={pos}
        onClick={() => tapTile(pos)}
        disabled={solved}
        className="relative aspect-square w-full overflow-hidden transition-all duration-150 active:scale-[0.97] disabled:cursor-default"
        style={{
          background: '#fbf9f4',
          border: sel
            ? `2px solid ${ACCENT}`
            : solved
              ? '1px solid rgba(132,204,22,0.5)'
              : correct
                ? '1px solid rgba(132,204,22,0.35)'
                : '1px solid #dcd5c6',
          boxShadow: sel ? `0 0 0 3px ${ACCENT}33` : correct && !solved ? 'inset 0 0 18px rgba(132,204,22,0.12)' : 'none',
          borderRadius: 6,
        }}
      >
        <svg viewBox={vb} className="w-full h-full" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <path d={puzzle.circuit.path} fill="none" stroke="#16120c" strokeWidth={puzzle.stroke} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    )
  }

  const placed = puzzle ? order.filter((tile, pos) => tile === pos || (puzzle.isEmpty[tile] && puzzle.isEmpty[pos])).length : 0

  // ── Idle ─────────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div ref={gameRef} className="p-6 md:p-10 space-y-8">
        <div className="text-center md:text-left">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: ACCENT }}>Circuit Puzzle</p>
          <p className="text-[#1a1712]/75 text-sm">A scrambled F1 circuit — rebuild it as fast as you can.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-widest mb-2">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(GRID) as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      difficulty === d
                        ? 'text-[#1a1712] bg-[#84cc16]/10'
                        : 'text-[#1a1712]/65 border-[#dcd5c6] bg-[#fbf9f4] hover:text-[#1a1712] hover:border-[#cfc7b5]'
                    }`}
                    style={difficulty === d ? { borderColor: 'rgba(132,204,22,0.5)' } : undefined}
                  >
                    {LABEL[d].split(' · ')[0]}
                    <span className="block text-[10px] font-mono opacity-60">{LABEL[d].split(' · ')[1]}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#1a1712]/55 mt-2">
                Each difficulty has its own global leaderboard — your time only races the same grid size.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div className="space-y-3 text-sm text-[#1a1712]">
              <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-widest mb-1">How to play</p>
              <p>The tiles of a real F1 circuit are scrambled. <span className="font-semibold">Tap two tiles to swap them</span> and rebuild the track.</p>
              <p>Tiles that are in the right place glow <span style={{ color: '#5a8a10', fontWeight: 600 }}>green</span>.</p>
              <p>The clock starts the moment the board appears — <span className="font-semibold">fastest build wins</span>.</p>
            </div>
            <button
              onClick={start}
              className="w-full py-4 rounded-2xl font-semibold text-black text-base transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: ACCENT }}
            >
              Start Building
            </button>
          </div>
        </div>

        {stats.played ? (
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(GRID) as Difficulty[]).map((d) => (
              <div key={d} className="rounded-xl border border-[#dcd5c6] bg-[#f3eee3] px-3 py-3 text-center">
                <p className="text-[#1a1712] text-base font-mono font-bold">{stats[d] !== undefined ? fmt(stats[d]!) : '—'}</p>
                <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">{LABEL[d].split(' · ')[0]} best</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  if (phase === 'playing' && puzzle) {
    return (
      <div ref={gameRef} className="p-5 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Reference thumbnail */}
            <svg viewBox={`${puzzle.sqX} ${puzzle.sqY} ${puzzle.side} ${puzzle.side}`} className="w-10 h-10 shrink-0 opacity-70" xmlns="http://www.w3.org/2000/svg">
              <path d={puzzle.circuit.path} fill="none" stroke="#16120c" strokeWidth={puzzle.stroke} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: ACCENT }}>Rebuild</p>
              <p className="text-[#1a1712] text-sm font-semibold leading-tight">{puzzle.circuit.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono tabular-nums text-[#1a1712] leading-none">{fmt(elapsed)}</p>
            <p className="text-[10px] font-mono text-[#1a1712]/55 mt-1">{placed}/{puzzle.n * puzzle.n} placed · {moves} moves</p>
          </div>
        </div>

        <div
          className="mx-auto grid w-full"
          style={{ maxWidth: 440, gridTemplateColumns: `repeat(${puzzle.n}, 1fr)`, gap: 5 }}
        >
          {order.map((_, pos) => renderTile(pos))}
        </div>

        <div className="mt-5 flex justify-center">
          <button
            onClick={() => setPhase('idle')}
            className="px-4 py-2 rounded-xl border border-[#dcd5c6] text-[#1a1712] text-sm opacity-50 hover:opacity-90 hover:border-[#c4bca8] transition-all"
          >
            Give up
          </button>
        </div>
      </div>
    )
  }

  // ── Result ───────────────────────────────────────────────────────────────────
  if (phase === 'result' && puzzle) {
    const shareText = [
      `🏗️ Track Builder — ${puzzle.circuit.name}`,
      `⏱ Rebuilt the ${LABEL[difficulty].split(' · ')[1]} puzzle in ${fmt(finalMs)} (${moves} swaps)`,
      `f1racesignature.site/games/track-builder`,
    ].join('\n')

    return (
      <div className="p-6 md:p-10">
        <div className="mb-8 text-center md:text-left">
          {isBest && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full text-xs font-mono uppercase tracking-widest"
              style={{ color: '#5a8a10', background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.35)' }}>
              ★ New Personal Best
            </span>
          )}
          <p className="text-3xl md:text-4xl font-bold mb-1" style={{ color: ACCENT, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Track Rebuilt!
          </p>
          <p className="text-[#1a1712]/70 text-sm">{puzzle.circuit.name} · {LABEL[difficulty]}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: completed track + stats */}
          <div className="rounded-2xl border border-[#e2dccd] bg-[#fbf9f4] p-5 space-y-4 h-fit">
            <svg viewBox={`${puzzle.sqX} ${puzzle.sqY} ${puzzle.side} ${puzzle.side}`} className="w-full max-h-44" xmlns="http://www.w3.org/2000/svg">
              <path d={puzzle.circuit.path} fill="none" stroke={ACCENT} strokeWidth={puzzle.stroke} strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 10px rgba(132,204,22,0.4))' }} />
            </svg>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#1a1712]/65">Time</span><span className="font-mono font-bold" style={{ color: ACCENT }}>{fmt(finalMs)}</span></div>
              <div className="flex justify-between"><span className="text-[#1a1712]/65">Swaps</span><span className="font-mono text-[#1a1712]">{moves}</span></div>
              <div className="flex justify-between"><span className="text-[#1a1712]/65">Difficulty</span><span className="font-mono text-[#1a1712]">{LABEL[difficulty]}</span></div>
              {stats[difficulty] !== undefined && (
                <div className="flex justify-between"><span className="text-[#1a1712]/65">Your best</span><span className="font-mono text-[#1a1712]">{fmt(stats[difficulty]!)}</span></div>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-col gap-3">
            <ShareButtons text={shareText} url="https://f1racesignature.site/games/track-builder" />
            <button onClick={start} className="w-full py-3.5 rounded-2xl font-semibold text-black transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: ACCENT }}>
              New Track
            </button>
            <button onClick={() => setPhase('idle')} className="w-full py-3 rounded-xl border border-[#dcd5c6] text-[#1a1712] text-sm opacity-50 hover:opacity-90 hover:border-[#c4bca8] transition-all">
              Change Difficulty
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Leaderboard gameId={BOARD_ID[difficulty]} score={Math.round(finalMs)} ascending suffix="ms" accent={ACCENT} meta={{ circuit: puzzle.circuit.id, moves }} />
        </div>

        <div className="mt-6">
          <NextGameCard currentId="track-builder" />
        </div>
      </div>
    )
  }

  return null
}
