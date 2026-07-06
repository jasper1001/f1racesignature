'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareButtons } from '@/components/games/ShareButtons'
import { NextGameCard } from '@/components/games/NextGameCard'
import { Leaderboard } from '@/components/games/Leaderboard'
import {
  PUZZLES,
  DIFFICULTY_COLORS,
  DIFFICULTY_EMOJI,
  getDayIndex,
  getDailyPuzzleIndex,
  type ConnPuzzle,
} from '@/lib/games/connectionsData'

const ACCENT = '#14b8a6'
const MAX_MISTAKES = 4
const STREAK_KEY = 'f1rs_connections_streak'
const DAILY_KEY = 'f1rs_connections_daily'

// ── Types & helpers ─────────────────────────────────────────────────────────────

type Mode = 'daily' | 'endless'
type Phase = 'setup' | 'playing' | 'over'

interface Tile {
  word: string
  groupIndex: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildTiles(puzzle: ConnPuzzle): Tile[] {
  const tiles: Tile[] = []
  puzzle.groups.forEach((g, gi) => g.members.forEach(word => tiles.push({ word, groupIndex: gi })))
  return shuffle(tiles)
}

interface Streak { current: number; best: number; lastDay: number }
function loadStreak(): Streak {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) ?? '{"current":0,"best":0,"lastDay":-1}') }
  catch { return { current: 0, best: 0, lastDay: -1 } }
}
function saveStreak(s: Streak) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)) } catch {}
}

interface DailyState { day: number; won: boolean; history: number[][] }
function loadDaily(): DailyState | null {
  try { return JSON.parse(localStorage.getItem(DAILY_KEY) ?? 'null') } catch { return null }
}
function saveDaily(s: DailyState) {
  try { localStorage.setItem(DAILY_KEY, JSON.stringify(s)) } catch {}
}

// ── Main component ──────────────────────────────────────────────────────────────

export function ConnectionsGame() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<Mode>('daily')
  const [puzzleIndex, setPuzzleIndex] = useState(0)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [solved, setSolved] = useState<number[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [won, setWon] = useState(false)
  const [history, setHistory] = useState<number[][]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)

  const gameRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const puzzle = PUZZLES[puzzleIndex]

  const flash = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }, [])

  const beginPuzzle = useCallback((m: Mode, index: number) => {
    const el = gameRef.current
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
    setMode(m)
    setPuzzleIndex(index)
    setTiles(buildTiles(PUZZLES[index]))
    setSelected([])
    setSolved([])
    setMistakes(0)
    setWon(false)
    setHistory([])
    setToast(null)
    setAlreadyDone(false)
    setPhase('playing')
  }, [])

  function startDaily() {
    const todayIdx = getDailyPuzzleIndex()
    const saved = loadDaily()
    if (saved && saved.day === getDayIndex()) {
      // Already completed today — show the finished board in read-only.
      setMode('daily')
      setPuzzleIndex(todayIdx)
      setTiles(buildTiles(PUZZLES[todayIdx]))
      setSolved([0, 1, 2, 3])
      setWon(saved.won)
      setHistory(saved.history)
      setMistakes(saved.won ? saved.history.length - 4 : MAX_MISTAKES)
      setAlreadyDone(true)
      setPhase('over')
      return
    }
    beginPuzzle('daily', todayIdx)
  }

  function startEndless() {
    const idx = Math.floor(Math.random() * PUZZLES.length)
    beginPuzzle('endless', idx)
  }

  function toggleTile(word: string) {
    if (phase !== 'playing') return
    setSelected(prev => {
      if (prev.includes(word)) return prev.filter(w => w !== word)
      if (prev.length >= 4) return prev
      return [...prev, word]
    })
  }

  function finish(didWin: boolean, finalHistory: number[][]) {
    setWon(didWin)
    setPhase('over')
    if (mode === 'daily') {
      saveDaily({ day: getDayIndex(), won: didWin, history: finalHistory })
      const s = loadStreak()
      if (s.lastDay !== getDayIndex()) {
        const continued = s.lastDay === getDayIndex() - 1
        const current = didWin ? (continued ? s.current + 1 : 1) : 0
        saveStreak({ current, best: Math.max(s.best, current), lastDay: getDayIndex() })
      }
    }
  }

  function submit() {
    if (selected.length !== 4) return
    const groupsOfSelected = selected.map(w => tiles.find(t => t.word === w)!.groupIndex)
    const row = [...groupsOfSelected]
    const newHistory = [...history, row]
    setHistory(newHistory)

    const first = groupsOfSelected[0]
    const allSame = groupsOfSelected.every(g => g === first)

    if (allSame) {
      const newSolved = [...solved, first]
      setSolved(newSolved)
      setSelected([])
      if (newSolved.length === 4) {
        finish(true, newHistory)
      }
      return
    }

    // Wrong guess — "one away" if 3 share a group.
    const counts = groupsOfSelected.reduce<Record<number, number>>((acc, g) => {
      acc[g] = (acc[g] ?? 0) + 1
      return acc
    }, {})
    const oneAway = Object.values(counts).some(c => c === 3)
    setShake(true)
    setTimeout(() => setShake(false), 450)
    flash(oneAway ? 'One away…' : 'Not a group')

    const newMistakes = mistakes + 1
    setMistakes(newMistakes)
    setSelected([])
    if (newMistakes >= MAX_MISTAKES) {
      // Reveal everything in difficulty order.
      setSolved([0, 1, 2, 3])
      finish(false, newHistory)
    }
  }

  // Tiles still on the board (not part of a solved group), kept in stable order.
  const remaining = tiles.filter(t => !solved.includes(t.groupIndex))
  const solvedOrdered = [...solved].sort((a, b) => puzzle.groups[a].difficulty - puzzle.groups[b].difficulty)

  // Build shareable emoji grid from guess history.
  const shareText = (() => {
    const head = mode === 'daily' ? `F1 Connections — Daily #${getDailyPuzzleIndex() + 1}` : 'F1 Connections'
    const grid = history.map(row => row.map(g => DIFFICULTY_EMOJI[puzzle.groups[g].difficulty]).join('')).join('\n')
    const outcome = won ? `Solved with ${MAX_MISTAKES - (history.length - 4)} ${MAX_MISTAKES - (history.length - 4) === 1 ? 'life' : 'lives'} left` : 'Out of lives'
    return `🏁 ${head}\n${outcome}\n${grid}\nf1racesignature.site/games/connections`
  })()

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div ref={gameRef}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-6">
            <p className="text-[#1a1712] text-[10px] font-mono uppercase tracking-widest mb-3">How to play</p>
            <ul className="space-y-2 text-[#1a1712] text-sm leading-relaxed">
              <li className="flex gap-2.5"><span style={{ color: ACCENT }} className="shrink-0">—</span> Find four groups of four connected F1 things.</li>
              <li className="flex gap-2.5"><span style={{ color: ACCENT }} className="shrink-0">—</span> Select four tiles, then submit. Each colour is one group.</li>
              <li className="flex gap-2.5"><span style={{ color: ACCENT }} className="shrink-0">—</span> Four wrong guesses and it&apos;s game over. Watch the overlaps.</li>
            </ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={startDaily}
              className="py-4 rounded-xl text-black font-semibold transition-all hover:brightness-105 active:scale-95"
              style={{ background: ACCENT }}
            >
              📅 Today&apos;s Puzzle
            </button>
            <button onClick={startEndless}
              className="py-4 rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] text-[#1a1712] font-medium hover:border-[#c4bca8] transition-all"
            >
              ∞ Random Puzzle
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── PLAYING / OVER ─────────────────────────────────────────────────────────
  return (
    <div ref={gameRef} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[#1a1712]/65 text-xs font-mono uppercase tracking-widest">
          {mode === 'daily' ? `Daily #${getDailyPuzzleIndex() + 1}` : 'Random'}
        </span>
        {phase === 'playing' && (
          <div className="flex items-center gap-2">
            <span className="text-[#1a1712]/65 text-xs font-mono">Mistakes</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: MAX_MISTAKES }, (_, i) => (
                <span key={i} className="w-3 h-3 rounded-full transition-colors"
                  style={{ background: i < mistakes ? '#cc4444' : 'rgba(26,23,18,0.15)' }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Solved group banners */}
      <div className="space-y-2">
        {solvedOrdered.map(gi => {
          const g = puzzle.groups[gi]
          return (
            <motion.div
              key={gi}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl px-4 py-3 text-center"
              style={{ background: DIFFICULTY_COLORS[g.difficulty] }}
            >
              <p className="text-white text-xs font-mono uppercase tracking-widest font-bold">{g.category}</p>
              <p className="text-white text-sm font-medium mt-0.5">{g.members.join(', ')}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Remaining tile grid */}
      {remaining.length > 0 && (
        <motion.div
          animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-4 gap-2"
        >
          {remaining.map(tile => {
            const isSel = selected.includes(tile.word)
            return (
              <button
                key={tile.word}
                onClick={() => toggleTile(tile.word)}
                disabled={phase !== 'playing'}
                className={`aspect-[5/4] sm:aspect-[3/2] rounded-xl flex items-center justify-center text-center px-1.5 transition-all duration-150 select-none ${
                  isSel
                    ? 'text-white scale-[0.97]'
                    : 'bg-[#fbf9f4] border border-[#dcd5c6] text-[#1a1712] hover:border-[#c4bca8] active:scale-95'
                }`}
                style={isSel ? { background: '#1a1712' } : undefined}
              >
                <span className="text-[11px] sm:text-sm font-semibold leading-tight break-words">
                  {tile.word}
                </span>
              </button>
            )
          })}
        </motion.div>
      )}

      {/* Toast */}
      <div className="h-5 text-center">
        <AnimatePresence>
          {toast && (
            <motion.span
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="inline-block px-3 py-1 rounded-full bg-[#1a1712] text-white text-xs font-mono"
            >
              {toast}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Controls (playing) */}
      {phase === 'playing' && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setTiles(prev => shuffle(prev))}
            className="py-3 rounded-xl border border-[#dcd5c6] text-[#1a1712]/70 text-sm font-medium hover:text-[#1a1712] hover:border-[#c4bca8] transition-all"
          >
            Shuffle
          </button>
          <button onClick={() => setSelected([])} disabled={selected.length === 0}
            className="py-3 rounded-xl border border-[#dcd5c6] text-[#1a1712]/70 text-sm font-medium hover:text-[#1a1712] hover:border-[#c4bca8] transition-all disabled:opacity-30"
          >
            Deselect
          </button>
          <button onClick={submit} disabled={selected.length !== 4}
            className="py-3 rounded-xl text-black font-semibold transition-all hover:brightness-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: ACCENT }}
          >
            Submit
          </button>
        </div>
      )}

      {/* Over */}
      {phase === 'over' && (
        <OverPanel
          won={won}
          mode={mode}
          alreadyDone={alreadyDone}
          shareText={shareText}
          onPlayAgain={mode === 'endless' ? startEndless : undefined}
        />
      )}
    </div>
  )
}

// ── Over panel ──────────────────────────────────────────────────────────────────

function OverPanel({
  won,
  mode,
  alreadyDone,
  shareText,
  onPlayAgain,
}: {
  won: boolean
  mode: Mode
  alreadyDone: boolean
  shareText: string
  onPlayAgain?: () => void
}) {
  const streak = mode === 'daily' ? loadStreak() : null

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-1">
      <div className="rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-6 text-center space-y-2">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: won ? '#38b000' : '#cc4444' }}>
          {alreadyDone ? 'Already played today' : won ? 'Solved it!' : 'Out of lives'}
        </p>
        <h3 className="text-2xl text-[#1a1712] font-display">
          {won ? 'All four groups cracked' : 'Better luck next time'}
        </h3>
        {streak && (
          <div className="flex items-center justify-center gap-8 pt-3">
            <div>
              <p className="text-[#1a1712] text-2xl font-mono">{streak.current}</p>
              <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Current streak</p>
            </div>
            <div className="w-px h-9 bg-[#ece6d9]" />
            <div>
              <p className="text-[#1a1712] text-2xl font-mono">{streak.best}</p>
              <p className="text-[#1a1712]/65 text-[10px] font-mono uppercase tracking-wider mt-0.5">Best streak</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <ShareButtons text={shareText} url="https://f1racesignature.site/games/connections" />
        {onPlayAgain ? (
          <button onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl text-black font-semibold transition-all hover:brightness-105 active:scale-95"
            style={{ background: ACCENT }}
          >
            Another Puzzle
          </button>
        ) : (
          <p className="text-center text-[#1a1712]/65 text-sm font-mono py-2">
            Come back tomorrow for a new puzzle.
          </p>
        )}
        {streak && <Leaderboard gameId="connections" score={streak.best} accent="#14b8a6" />}
        <NextGameCard currentId="connections" />
      </div>
    </motion.div>
  )
}
