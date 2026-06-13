'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RADIO_QUOTES, type RadioQuote } from '@/lib/games/teamRadioData'
import { ShareButtons } from '@/components/games/ShareButtons'

const ROUNDS = 10
const POINTS_PER_CORRECT = 100

type GameState = 'playing' | 'answered' | 'finished'

interface RoundData extends RadioQuote {
  shuffledOptions: [string, string, string, string]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRounds(): RoundData[] {
  return shuffle(RADIO_QUOTES)
    .slice(0, ROUNDS)
    .map((q) => ({
      ...q,
      shuffledOptions: shuffle([...q.options]) as [string, string, string, string],
    }))
}

function getResultMessage(score: number): { title: string; subtitle: string } {
  const pct = score / (ROUNDS * POINTS_PER_CORRECT)
  if (pct >= 0.9) return { title: 'Radio Legend', subtitle: 'You know every transmission by heart.' }
  if (pct >= 0.7) return { title: 'Race Engineer Material', subtitle: "Not bad. You really know your driver's voices." }
  if (pct >= 0.5) return { title: 'You Know Your Memes', subtitle: 'Solid knowledge of the famous ones.' }
  return { title: 'Box Box for More Practice', subtitle: 'Time to rewatch the race highlights.' }
}

export function TeamRadioGame() {
  const [rounds, setRounds] = useState<RoundData[]>(buildRounds)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [savedBestScore, setSavedBestScore] = useState(0)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('teamRadioStats') ?? '{}')
      setSavedBestScore(saved.bestScore ?? 0)
    } catch {}
  }, [])

  const quote = rounds[current]
  const isLastRound = current + 1 >= ROUNDS

  function handleAnswer(option: string) {
    if (gameState !== 'playing') return
    const correct = option === quote.driver
    const newScore = correct ? score + POINTS_PER_CORRECT : score
    const newStreak = correct ? streak + 1 : 0
    const newBest = Math.max(bestStreak, newStreak)
    setSelected(option)
    setScore(newScore)
    setStreak(newStreak)
    setBestStreak(newBest)
    setGameState('answered')

    if (isLastRound) {
      try {
        const saved = JSON.parse(localStorage.getItem('teamRadioStats') ?? '{}')
        const updated = {
          bestScore: Math.max(saved.bestScore ?? 0, newScore),
          bestStreak: Math.max(saved.bestStreak ?? 0, newBest),
          gamesPlayed: (saved.gamesPlayed ?? 0) + 1,
        }
        localStorage.setItem('teamRadioStats', JSON.stringify(updated))
        setSavedBestScore(updated.bestScore)
      } catch {}
    }
  }

  function handleNext() {
    if (isLastRound) {
      setGameState('finished')
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
      setGameState('playing')
    }
  }

  function handleRestart() {
    setRounds(buildRounds())
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setGameState('playing')
  }

  if (gameState === 'finished') {
    return (
      <ResultScreen
        score={score}
        bestScore={savedBestScore}
        bestStreak={bestStreak}
        onRestart={handleRestart}
      />
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Stats row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-5">
          <div>
            <p className="text-[#444444] text-[10px] font-mono uppercase tracking-widest mb-0.5">Score</p>
            <p className="text-[#d4a017] text-xl font-mono tabular-nums">{score}</p>
          </div>
          <AnimatePresence>
            {streak >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <p className="text-[#444444] text-[10px] font-mono uppercase tracking-widest mb-0.5">Streak</p>
                <p className="text-[#38b000] text-xl font-mono">{streak}×</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="text-right">
          <p className="text-[#444444] text-[10px] font-mono uppercase tracking-widest mb-0.5">Round</p>
          <p className="text-white text-xl font-mono tabular-nums">
            {current + 1}<span className="text-[#2a2a2a]"> / {ROUNDS}</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-px bg-[#111111] mb-8 relative overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-0 left-0 bg-[#d4a017] rounded-full"
          animate={{ width: `${(current / ROUNDS) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Radio card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.28 }}
          className="relative rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden mb-5"
        >
          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.12) 3px, rgba(255,255,255,0.12) 4px)',
            }}
          />

          {/* Card header */}
          <div className="relative flex items-center justify-between px-5 py-3.5 border-b border-[#111111]">
            <div className="flex items-center gap-2">
              <RadioWaveIcon />
              <span className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest">
                Incoming Transmission
              </span>
            </div>
            <span className="text-[#2a2a2a] text-[10px] font-mono uppercase tracking-wider">
              {quote.race}&nbsp;·&nbsp;{quote.year}
            </span>
          </div>

          {/* Quote body */}
          <div className="relative px-6 py-8 md:px-8 md:py-10">
            <p className="text-[#333333] text-[10px] font-mono uppercase tracking-widest mb-5">
              &#x2758; radio transcript &#x2758;
            </p>
            <blockquote
              className="text-white text-xl md:text-2xl leading-relaxed"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              &ldquo;{quote.quote}&rdquo;
            </blockquote>
          </div>

          {/* Context reveal */}
          <AnimatePresence>
            {gameState === 'answered' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="relative border-t border-[#111111] px-6 md:px-8 py-5"
              >
                <p className="text-[#333333] text-[10px] font-mono uppercase tracking-widest mb-2">
                  Context
                </p>
                <p className="text-[#777777] text-sm leading-relaxed">{quote.context}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        {quote.shuffledOptions.map((option) => {
          const isCorrectOption = option === quote.driver
          const isSelectedOption = option === selected
          const answered = gameState === 'answered'

          let cls = 'border-[#1a1a1a] bg-[#080808] text-white hover:border-[#2a2a2a] hover:bg-[#0d0d0d]'
          if (answered) {
            if (isCorrectOption) {
              cls = 'border-[#38b000]/40 bg-[#38b000]/8 text-[#38b000]'
            } else if (isSelectedOption) {
              cls = 'border-[#cc3333]/40 bg-[#cc3333]/8 text-[#cc3333]'
            } else {
              cls = 'border-[#111111] bg-[#050505] text-[#2a2a2a]'
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={answered}
              className={`flex items-center gap-2.5 px-5 py-4 rounded-xl border text-left font-medium transition-all duration-200 disabled:cursor-default ${cls}`}
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {answered && isCorrectOption && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {answered && isSelectedOption && !isCorrectOption && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              {option}
            </button>
          )
        })}
      </div>

      {/* Next row */}
      <AnimatePresence>
        {gameState === 'answered' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between"
          >
            <span
              className="text-sm font-medium"
              style={{ color: selected === quote.driver ? '#38b000' : '#cc3333' }}
            >
              {selected === quote.driver
                ? `+${POINTS_PER_CORRECT} points`
                : `No points — it was ${quote.driver}`}
            </span>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all active:scale-95"
            >
              {isLastRound ? 'See Results' : 'Next Quote'}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RadioWaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#d4a017]">
      <path d="M1 7c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
      <path d="M3.5 7c0-1.9 1.6-3.5 3.5-3.5S10.5 5.1 10.5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
    </svg>
  )
}

function ResultScreen({
  score,
  bestScore,
  bestStreak,
  onRestart,
}: {
  score: number
  bestScore: number
  bestStreak: number
  onRestart: () => void
}) {
  const maxScore = ROUNDS * POINTS_PER_CORRECT
  const correct = score / POINTS_PER_CORRECT
  const result = getResultMessage(score)
  const isNewBest = score >= bestScore && score > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Result card */}
      <div className="relative rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden mb-5">
        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.12) 3px, rgba(255,255,255,0.12) 4px)',
          }}
        />

        <div className="relative px-6 py-10 md:px-10 md:py-12 text-center">
          {isNewBest && (
            <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest mb-4">
              ★ New best score
            </p>
          )}

          <h2
            className="text-3xl md:text-4xl text-white mb-2"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {result.title}
          </h2>
          <p className="text-[#555555] text-sm mb-10">{result.subtitle}</p>

          {/* Score display */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-6xl font-mono text-white tabular-nums">{score}</span>
            <span className="text-[#333333] text-2xl font-mono self-end mb-1">/ {maxScore}</span>
          </div>
          <p className="text-[#444444] text-sm font-mono mb-10">
            {correct} correct out of {ROUNDS} rounds
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 border-t border-[#111111] pt-8">
            <div>
              <p className="text-[#333333] text-[10px] font-mono uppercase tracking-widest mb-1">Best Score</p>
              <p className="text-white text-xl font-mono tabular-nums">{bestScore}</p>
            </div>
            <div className="w-px h-8 bg-[#111111]" />
            <div>
              <p className="text-[#333333] text-[10px] font-mono uppercase tracking-widest mb-1">Best Streak</p>
              <p className="text-white text-xl font-mono">{bestStreak}×</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <ShareButtons
          text={`🏎️ Team Radio Guess\n${score}/${maxScore} — ${result.title}\nf1racesignature.site/games/team-radio`}
          url="https://f1racesignature.site/games/team-radio"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onRestart}
            className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all active:scale-95"
          >
            Play Again
          </button>
          <a
            href="/games"
            className="flex-1 inline-flex items-center justify-center px-8 py-4 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/8 transition-all"
          >
            All Games
          </a>
        </div>
      </div>
    </motion.div>
  )
}
