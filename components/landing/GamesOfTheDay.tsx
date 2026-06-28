'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GAMES, type GameMeta } from '@/lib/games/registry'

// Three daily-rotating mini-game picks for the homepage. The selection is
// deterministic per calendar day (epoch-day index, timezone-independent) so it's
// the same for everyone and cycles through the whole catalogue over time.
const COUNT = 3

function picksForDay(day: number): GameMeta[] {
  // COUNT < GAMES.length, so COUNT consecutive (wrapping) indices are distinct.
  return Array.from({ length: COUNT }, (_, i) => GAMES[(day * COUNT + i) % GAMES.length])
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GamesOfTheDay() {
  // SSR (static build) can't know the runtime date, so render a stable default
  // first (no hydration mismatch) and swap to today's picks after mount.
  const [picks, setPicks] = useState<GameMeta[]>(() => GAMES.slice(0, COUNT))
  useEffect(() => {
    setPicks(picksForDay(Math.floor(Date.now() / 86_400_000)))
  }, [])

  return (
    <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-2">
              Games of the Day
            </p>
            <h2 className="text-2xl md:text-3xl text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Today&apos;s Picks
            </h2>
            <p className="text-white/65 text-sm mt-2">
              Three F1 mini-games, refreshed every day. Come back tomorrow for a new set.
            </p>
          </div>
          <Link
            href="/games"
            className="hidden sm:inline-flex items-center gap-2 text-white/65 hover:text-[#d4a017] text-sm font-medium whitespace-nowrap transition-colors"
          >
            All games
            <Arrow />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {picks.map((g) => (
            <Link
              key={g.id}
              href={g.href}
              className="group relative block rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 hover:border-[#d4a017]/40 transition-colors overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: g.accent }} />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 75% 65% at 0% 50%, ${g.accent}14 0%, transparent 65%)` }}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-xl"
                    style={{ background: `${g.accent}15`, border: `1px solid ${g.accent}25` }}
                  >
                    {g.icon}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: g.accent }}>
                    {g.tag}
                  </span>
                </div>
                <h3 className="text-xl text-white mb-1.5" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  {g.title}
                </h3>
                <p className="text-white/65 text-sm leading-snug">{g.blurb}</p>
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-semibold mt-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ color: g.accent }}
                >
                  Play
                  <Arrow />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/games"
          className="sm:hidden inline-flex items-center gap-2 text-white/65 hover:text-[#d4a017] text-sm font-medium mt-5 transition-colors"
        >
          All games
          <Arrow />
        </Link>
      </div>
    </section>
  )
}
