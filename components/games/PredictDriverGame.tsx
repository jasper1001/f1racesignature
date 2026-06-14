'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShareButtons } from '@/components/games/ShareButtons'
import {
  DRIVERS,
  getPool,
  getDailyDriver,
  getDailyKey,
  buildHints,
  type Driver,
  type Difficulty,
  type GuessResult,
  type CellHint,
  type HintColor,
} from '@/lib/games/predictDriverData'

const MAX_GUESSES = 6

type GameMode = 'daily' | 'endless'
type Phase = 'setup' | 'game' | 'result'

// ── LocalStorage helpers ─────────────────────────────────────────────────────

function loadDailyState(difficulty: Difficulty) {
  try {
    const raw = localStorage.getItem(getDailyKey(difficulty))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDailyState(difficulty: Difficulty, data: object) {
  try { localStorage.setItem(getDailyKey(difficulty), JSON.stringify(data)) } catch {}
}

function loadEndlessStats() {
  try {
    return JSON.parse(localStorage.getItem('predict_endless_stats') ?? '{"wins":0,"losses":0,"streak":0,"best":0}')
  } catch { return { wins: 0, losses: 0, streak: 0, best: 0 } }
}

function saveEndlessStats(stats: { wins: number; losses: number; streak: number; best: number }) {
  try { localStorage.setItem('predict_endless_stats', JSON.stringify(stats)) } catch {}
}

function loadDailyStreak() {
  try {
    return JSON.parse(localStorage.getItem('predict_daily_streak') ?? '{"current":0,"best":0}')
  } catch { return { current: 0, best: 0 } }
}

function saveDailyStreak(s: { current: number; best: number }) {
  try { localStorage.setItem('predict_daily_streak', JSON.stringify(s)) } catch {}
}

// ── Main component ────────────────────────────────────────────────────────────

export function PredictDriverGame() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [mode, setMode] = useState<GameMode>('daily')
  const [difficulty, setDifficulty] = useState<Difficulty>('ultimate')
  const [mystery, setMystery] = useState<Driver | null>(null)
  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [won, setWon] = useState(false)
  const [dailyAlreadyPlayed, setDailyAlreadyPlayed] = useState(false)

  function startGame(m: GameMode, d: Difficulty) {
    const pool = getPool(d)
    if (m === 'daily') {
      const saved = loadDailyState(d)
      if (saved?.completed) {
        const driver = pool.find(dr => dr.id === saved.mysteryId) ?? pool[0]
        const rebuilt: GuessResult[] = (saved.guessIds as string[]).map((id: string) => {
          const dr = DRIVERS.find(x => x.id === id)!
          return { driver: dr, hints: buildHints(dr, driver) }
        })
        setMystery(driver)
        setGuesses(rebuilt)
        setWon(saved.won)
        setDailyAlreadyPlayed(true)
        setMode(m)
        setDifficulty(d)
        setPhase('result')
        return
      }
      setMystery(getDailyDriver(pool))
    } else {
      const pool2 = getPool(d)
      setMystery(pool2[Math.floor(Math.random() * pool2.length)])
    }
    setGuesses([])
    setWon(false)
    setDailyAlreadyPlayed(false)
    setMode(m)
    setDifficulty(d)
    setPhase('game')
  }

  function handleGuess(driver: Driver) {
    if (!mystery || guesses.length >= MAX_GUESSES) return
    const result: GuessResult = { driver, hints: buildHints(driver, mystery) }
    const newGuesses = [...guesses, result]
    const correct = driver.id === mystery.id
    const finished = correct || newGuesses.length >= MAX_GUESSES
    setGuesses(newGuesses)

    if (finished) {
      setWon(correct)
      if (mode === 'daily') {
        saveDailyState(difficulty, {
          completed: true,
          won: correct,
          mysteryId: mystery.id,
          guessIds: newGuesses.map(g => g.driver.id),
        })
        const streak = loadDailyStreak()
        const next = correct ? streak.current + 1 : 0
        saveDailyStreak({ current: next, best: Math.max(streak.best, next) })
      } else {
        const stats = loadEndlessStats()
        const newStreak = correct ? stats.streak + 1 : 0
        saveEndlessStats({
          wins: stats.wins + (correct ? 1 : 0),
          losses: stats.losses + (correct ? 0 : 1),
          streak: newStreak,
          best: Math.max(stats.best, newStreak),
        })
      }
      setPhase('result')
    }
  }

  function handlePlayAgain() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (mode === 'endless') {
      const pool = getPool(difficulty)
      setMystery(pool[Math.floor(Math.random() * pool.length)])
      setGuesses([])
      setWon(false)
      setPhase('game')
    } else {
      setPhase('setup')
    }
  }

  if (phase === 'setup') return <SetupScreen onStart={startGame} />
  if (phase === 'game' && mystery)
    return (
      <GameScreen
        mystery={mystery}
        guesses={guesses}
        mode={mode}
        difficulty={difficulty}
        onGuess={handleGuess}
      />
    )
  if (phase === 'result' && mystery)
    return (
      <ResultScreen
        mystery={mystery}
        guesses={guesses}
        won={won}
        mode={mode}
        dailyAlreadyPlayed={dailyAlreadyPlayed}
        onPlayAgain={handlePlayAgain}
        onBackToSetup={() => setPhase('setup')}
      />
    )
  return null
}

// ── Setup screen ──────────────────────────────────────────────────────────────

const DIFFICULTIES: { key: Difficulty; label: string; desc: string }[] = [
  { key: 'rookie',   label: 'Rookie',   desc: 'World champions only' },
  { key: 'modern',   label: 'Modern',   desc: '2010+ era drivers' },
  { key: 'legends',  label: 'Legends',  desc: 'Pre-2010 drivers' },
  { key: 'ultimate', label: 'Ultimate', desc: 'All 60+ drivers' },
]

function SetupScreen({ onStart }: { onStart: (m: GameMode, d: Difficulty) => void }) {
  const [mode, setMode] = useState<GameMode>('daily')
  const [difficulty, setDifficulty] = useState<Difficulty>('ultimate')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Rules */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-6 mb-5">
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3">How to play</p>
        <ul className="space-y-2 text-white text-sm leading-relaxed">
          <li className="flex gap-2.5">
            <span className="text-[#d4a017] shrink-0">—</span>
            Guess the mystery F1 driver in <span className="text-[#d4a017]">6 attempts</span>.
          </li>
          <li className="flex gap-2.5">
            <span className="text-[#d4a017] shrink-0">—</span>
            Each guess reveals colour hints across 7 attributes.
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0 flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#38b000]/30 border border-[#38b000]/40" />
            </span>
            <span><span className="text-[#38b000]">Green</span> = exact match.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0 flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#d4a017]/20 border border-[#d4a017]/30" />
            </span>
            <span><span className="text-[#d4a017]">Yellow</span> = close (numbers) or partial overlap (teams).</span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0 flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#993333]/20 border border-[#993333]/30" />
            </span>
            <span><span className="text-[#cc4444]">Red</span> = no match. ↑↓ arrows show which direction to guess.</span>
          </li>
        </ul>
      </div>

      {/* Mode */}
      <div className="mb-4">
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-2.5">Mode</p>
        <div className="grid grid-cols-2 gap-2">
          {(['daily', 'endless'] as GameMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-3.5 rounded-xl border font-medium text-sm capitalize transition-all ${
                mode === m
                  ? 'border-[#d4a017]/50 bg-[#d4a017]/10 text-[#d4a017]'
                  : 'border-[#1a1a1a] bg-[#080808] text-white hover:border-[#2a2a2a]'
              }`}
            >
              {m === 'daily' ? '📅 Daily' : '∞ Endless'}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="mb-6">
        <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-2.5">Difficulty</p>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.key}
              onClick={() => setDifficulty(d.key)}
              className={`py-3 px-4 rounded-xl border text-left transition-all ${
                difficulty === d.key
                  ? 'border-[#d4a017]/50 bg-[#d4a017]/10'
                  : 'border-[#1a1a1a] bg-[#080808] hover:border-[#2a2a2a]'
              }`}
            >
              <p className={`text-sm font-medium ${difficulty === d.key ? 'text-[#d4a017]' : 'text-white'}`}>
                {d.label}
              </p>
              <p className="text-white/70 text-xs mt-0.5">{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onStart(mode, difficulty)}
        className="w-full py-4 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all active:scale-95"
      >
        Start Game
      </button>
    </motion.div>
  )
}

// ── Game screen ───────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'nationality',   label: 'NAT',    flex: 1.8, minWidth: 88 },
  { key: 'championships', label: 'TITLES', flex: 1.0, minWidth: 54 },
  { key: 'wins',          label: 'WINS',   flex: 1.0, minWidth: 54 },
  { key: 'poles',         label: 'POLES',  flex: 1.0, minWidth: 54 },
  { key: 'debutYear',     label: 'DEBUT',  flex: 1.0, minWidth: 54 },
  { key: 'status',        label: 'STATUS', flex: 1.3, minWidth: 68 },
  { key: 'teams',         label: 'TEAMS',  flex: 2.8, minWidth: 108 },
] as const

function GameScreen({
  mystery,
  guesses,
  mode,
  difficulty,
  onGuess,
}: {
  mystery: Driver
  guesses: GuessResult[]
  mode: GameMode
  difficulty: string
  onGuess: (d: Driver) => void
}) {
  const remaining = MAX_GUESSES - guesses.length
  const guessedIds = new Set(guesses.map(g => g.driver.id))
  const gridRef = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-white text-[10px] font-mono uppercase tracking-widest">
          {mode === 'daily' ? 'Daily' : 'Endless'} · {difficulty}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: MAX_GUESSES }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border transition-colors ${
                i < guesses.length
                  ? 'bg-[#d4a017] border-[#d4a017]'
                  : 'bg-transparent border-[#2a2a2a]'
              }`}
            />
          ))}
          <span className="text-white text-xs font-mono ml-2">{remaining} left</span>
        </div>
      </div>

      {/* Grid: column headers + guess rows in one scroll container */}
      <div className="overflow-x-auto mb-5" ref={gridRef}>
        {/* Column headers */}
        <div className="flex gap-1.5 mb-2">
          <div style={{ flex: '0 0 170px' }} />
          {COLUMNS.map(col => (
            <div
              key={col.key}
              className="text-white text-[11px] font-mono uppercase tracking-wider text-center"
              style={{ flex: col.flex, minWidth: col.minWidth }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Guess rows */}
        <div className="space-y-2">
          {guesses.map((g, i) => (
            <motion.div
              key={g.driver.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="flex gap-1.5"
            >
              <div
                className="flex items-center px-3 rounded-lg border border-[#1a1a1a] bg-[#080808]"
                style={{ flex: '0 0 170px', minHeight: 52 }}
              >
                <span className="text-white text-sm font-medium leading-snug">{g.driver.name}</span>
              </div>
              {COLUMNS.map(col => (
                <HintCell
                  key={col.key}
                  hint={g.hints[col.key as keyof typeof g.hints]}
                  colFlex={col.flex}
                  colMinWidth={col.minWidth}
                />
              ))}
            </motion.div>
          ))}

          {/* Empty remaining rows */}
          {Array.from({ length: remaining }, (_, i) => (
            <div key={`empty-${i}`} className="flex gap-1.5 opacity-20">
              <div className="h-13 rounded-lg border border-[#111111]" style={{ flex: '0 0 170px' }} />
              {COLUMNS.map(col => (
                <div
                  key={col.key}
                  className="h-13 rounded-lg border border-[#111111]"
                  style={{ flex: col.flex, minWidth: col.minWidth }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <DriverSearch
        guessedIds={guessedIds}
        onGuess={onGuess}
        disabled={guesses.length >= MAX_GUESSES}
      />
    </div>
  )
}

// ── Hint cell ─────────────────────────────────────────────────────────────────

const COLOR_CLASSES: Record<HintColor, string> = {
  green:  'bg-[#0d2010] border-[#38b000]/35 text-[#38b000]',
  yellow: 'bg-[#1a1400] border-[#d4a017]/35 text-[#d4a017]',
  red:    'bg-[#150808] border-[#883333]/35 text-[#cc4444]',
}

function HintCell({ hint, colFlex, colMinWidth }: { hint: CellHint; colFlex: number; colMinWidth: number }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border text-center px-1.5 py-2 ${COLOR_CLASSES[hint.color]}`}
      style={{ flex: colFlex, minWidth: colMinWidth, minHeight: 52 }}
    >
      <span className="text-xs font-mono leading-snug break-words w-full text-center">
        {hint.display}
      </span>
      {hint.direction && (
        <span className="text-sm font-bold leading-none mt-1">
          {hint.direction === 'up' ? '↑' : '↓'}
        </span>
      )}
    </div>
  )
}

// ── Driver search / autocomplete ──────────────────────────────────────────────

function DriverSearch({
  guessedIds,
  onGuess,
  disabled,
}: {
  guessedIds: Set<string>
  onGuess: (d: Driver) => void
  disabled: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = query.length >= 1
    ? DRIVERS.filter(
        d => !guessedIds.has(d.id) && d.name.toLowerCase().includes(query.toLowerCase()),
      ).slice(0, 7)
    : []

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(driver: Driver) {
    onGuess(driver)
    setQuery('')
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        disabled={disabled}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => query && setOpen(true)}
        placeholder={disabled ? 'No guesses remaining' : 'Search for a driver…'}
        className="w-full px-4 py-3.5 rounded-xl border border-[#1a1a1a] bg-[#080808] text-white text-sm placeholder-[#888888] focus:outline-none focus:border-[#d4a017]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      />

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden shadow-2xl"
          >
            {results.map(driver => (
              <button
                key={driver.id}
                onMouseDown={() => select(driver)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#111111] transition-colors border-b border-[#0f0f0f] last:border-0"
              >
                <span className="text-white text-sm">{driver.name}</span>
                <span className="text-white/70 text-xs font-mono">
                  {driver.nationality} · {driver.debutYear}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Result screen ─────────────────────────────────────────────────────────────

function ResultScreen({
  mystery,
  guesses,
  won,
  mode,
  dailyAlreadyPlayed,
  onPlayAgain,
  onBackToSetup,
}: {
  mystery: Driver
  guesses: GuessResult[]
  won: boolean
  mode: GameMode
  dailyAlreadyPlayed: boolean
  onPlayAgain: () => void
  onBackToSetup: () => void
}) {
  const streak = loadDailyStreak()
  const endless = loadEndlessStats()
  const shareText = (() => {
    const guessCount = guesses.length
    const outcome = won
      ? `Solved in ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'}`
      : 'Not solved'
    const modeLabel = mode === 'daily' ? ' (Daily)' : ''
    return `🏎️ Predict the Driver${modeLabel}\n${outcome} — ${mystery.name}\nf1racesignature.site/games/predict-driver`
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto"
    >
      {/* Outcome */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden mb-4">
        <div className="px-6 py-5 border-b border-[#111111]">
          <p className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${won ? 'text-[#38b000]' : 'text-[#cc4444]'}`}>
            {won ? (dailyAlreadyPlayed ? 'Already completed today' : 'Correct!') : 'The answer was'}
          </p>
          <h2
            className="text-2xl md:text-3xl text-white"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {mystery.name}
          </h2>
          <p className="text-white text-sm mt-1">
            {mystery.nationality} · {mystery.championships > 0 ? `${mystery.championships}× World Champion` : 'No championships'} · Debuted {mystery.debutYear}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-[#111111]">
          <div className="px-4 py-4 text-center">
            <p className="text-white text-[10px] font-mono uppercase tracking-wider mb-1">Wins</p>
            <p className="text-white text-lg font-mono">{mystery.wins}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-white text-[10px] font-mono uppercase tracking-wider mb-1">Poles</p>
            <p className="text-white text-lg font-mono">{mystery.poles}</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-white text-[10px] font-mono uppercase tracking-wider mb-1">Teams</p>
            <p className="text-white text-sm font-mono">{mystery.teams.length}</p>
          </div>
        </div>
      </div>

      {/* Session stats */}
      {!dailyAlreadyPlayed && (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5 mb-4">
          <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-4">Your stats</p>
          {mode === 'daily' ? (
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-white text-2xl font-mono">{streak.current}</p>
                <p className="text-white text-xs font-mono mt-1">Current streak</p>
              </div>
              <div className="w-px h-10 bg-[#111111]" />
              <div className="text-center">
                <p className="text-white text-2xl font-mono">{streak.best}</p>
                <p className="text-white text-xs font-mono mt-1">Best streak</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-white text-2xl font-mono">{endless.wins}</p>
                <p className="text-white text-xs font-mono mt-1">Wins</p>
              </div>
              <div className="w-px h-10 bg-[#111111]" />
              <div className="text-center">
                <p className="text-white text-2xl font-mono">{endless.streak}</p>
                <p className="text-white text-xs font-mono mt-1">Streak</p>
              </div>
              <div className="w-px h-10 bg-[#111111]" />
              <div className="text-center">
                <p className="text-white text-2xl font-mono">{endless.best}</p>
                <p className="text-white text-xs font-mono mt-1">Best</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guess summary */}
      {guesses.length > 0 && (
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5 mb-5">
          <p className="text-white text-[10px] font-mono uppercase tracking-widest mb-3">
            {won ? `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}` : `${guesses.length} / ${MAX_GUESSES} guesses used`}
          </p>
          <div className="space-y-1">
            {guesses.map((g, i) => (
              <div key={g.driver.id} className="flex items-center gap-2">
                <span className="text-white text-[10px] font-mono w-4">{i + 1}</span>
                <span className={`text-sm ${g.driver.id === mystery.id ? 'text-[#38b000]' : 'text-white'}`}>
                  {g.driver.name}
                </span>
                {g.driver.id === mystery.id && (
                  <span className="text-[#38b000] text-xs">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <ShareButtons
          text={shareText}
          url="https://f1racesignature.site/games/predict-driver"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          {mode === 'endless' ? (
            <button
              onClick={onPlayAgain}
              className="flex-1 py-4 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all active:scale-95"
            >
              Play Again
            </button>
          ) : (
            <p className="flex-1 py-4 text-center text-white text-sm font-mono">
              Come back tomorrow for a new driver.
            </p>
          )}
          <button
            onClick={onBackToSetup}
            className="flex-1 py-4 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/8 transition-all"
          >
            Change Mode
          </button>
        </div>
      </div>
    </motion.div>
  )
}
