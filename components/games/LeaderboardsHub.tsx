'use client'

import { useState } from 'react'
import { GAMES } from '@/lib/games/registry'
import { LEADERBOARD_GAME_IDS, LEADERBOARD_META } from '@/lib/games/leaderboardMeta'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { TrackBuilderLeaderboards } from '@/components/games/TrackBuilderLeaderboards'
import { supabaseEnabled } from '@/lib/leaderboard'

// Central "Leaderboards" section for the /games hub: pick a game, see its board.
export function LeaderboardsHub() {
  const games = LEADERBOARD_GAME_IDS
    .map((id) => GAMES.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
  const [active, setActive] = useState(games[0]?.id ?? '')

  if (!supabaseEnabled || games.length === 0) return null

  return (
    <section className="max-w-3xl mx-auto px-4 pb-16">
      <div className="text-center mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#1a1712]/55 mb-2">Compete</p>
        <h2 className="text-3xl text-[#1a1712] font-display">
          🏆 Leaderboards
        </h2>
        <p className="text-[#1a1712]/65 text-sm mt-1">Top scores from players around the world.</p>
      </div>

      {/* Game picker */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {games.map((g) => {
          const isActive = g.id === active
          const accent = LEADERBOARD_META[g.id]?.accent ?? '#d4a017'
          return (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={isActive
                ? { color: '#1a1712', background: `${accent}1a`, borderColor: `${accent}66` }
                : { color: 'rgba(26,23,18,0.6)', background: '#fbf9f4', borderColor: '#dcd5c6' }}
            >
              <span aria-hidden>{g.icon}</span>{g.title}
            </button>
          )
        })}
      </div>

      {/* Track Builder has three per-difficulty boards → show its own toggle. */}
      {active === 'track-builder'
        ? <TrackBuilderLeaderboards key="track-builder" />
        : <LeaderboardView key={active} gameId={active} limit={10} title={`${GAMES.find((g) => g.id === active)?.title ?? ''} — Top Scores`} />}
    </section>
  )
}
