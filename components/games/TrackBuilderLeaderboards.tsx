'use client'

import { useState } from 'react'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { supabaseEnabled } from '@/lib/leaderboard'

// The three per-difficulty Track Builder boards, browsable via a small toggle.
// Each grid size has its own game_config row so times only race the same size.
const TABS = [
  { id: 'track-builder',        label: 'Pro · 4×4' },
  { id: 'track-builder-rookie', label: 'Rookie · 3×3' },
  { id: 'track-builder-elite',  label: 'Elite · 5×5' },
] as const

const ACCENT = '#84cc16'

export function TrackBuilderLeaderboards() {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('track-builder')
  if (!supabaseEnabled) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-2">
        {TABS.map((t) => {
          const on = t.id === active
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={on
                ? { color: '#1a1712', background: `${ACCENT}1a`, borderColor: `${ACCENT}66` }
                : { color: 'rgba(26,23,18,0.6)', background: '#fbf9f4', borderColor: '#dcd5c6' }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <LeaderboardView
        key={active}
        gameId={active}
        title={`${TABS.find((t) => t.id === active)?.label} — Top Times`}
      />
    </div>
  )
}
