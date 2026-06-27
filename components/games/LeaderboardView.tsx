'use client'

import { useEffect, useState } from 'react'
import { getLeaderboard, getMyEntry, supabaseEnabled, type ScoreRow } from '@/lib/leaderboard'
import { LEADERBOARD_META } from '@/lib/games/leaderboardMeta'
import { LeaderboardRows } from '@/components/games/LeaderboardRows'

// Read-only "Top Scores" board for a game — for browsing without playing.
// Renders nothing until Supabase is configured (so the app is unaffected without it).
export function LeaderboardView({ gameId, limit = 10, title = 'Top Scores' }: {
  gameId: string
  limit?: number
  title?: string
}) {
  if (!supabaseEnabled) return null
  return <Inner gameId={gameId} limit={limit} title={title} />
}

function Inner({ gameId, limit, title }: { gameId: string; limit: number; title: string }) {
  const meta = LEADERBOARD_META[gameId] ?? { accent: '#d4a017' }
  const { accent, suffix = '', ascending = false } = meta

  const [rows, setRows] = useState<ScoreRow[]>([])
  const [mine, setMine] = useState<{ row: ScoreRow; rank: number } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let on = true
    setLoaded(false)
    Promise.all([
      getLeaderboard(gameId, { limit, ascending }),
      getMyEntry(gameId, { ascending }),
    ])
      .then(([b, m]) => { if (on) { setRows(b); setMine(m) } })
      .catch(() => {})
      .finally(() => { if (on) setLoaded(true) })
    return () => { on = false }
  }, [gameId, limit, ascending])

  if (!loaded) return null

  return (
    <div className="rounded-2xl border border-[#dcd5c6] bg-[#f4f1ea] p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#1a1712]/55">{title}</p>
        {mine && <span className="text-[11px] font-mono text-[#1a1712]/70">Your rank: <b style={{ color: accent }}>#{mine.rank}</b></span>}
      </div>
      <LeaderboardRows rows={rows} mine={mine} accent={accent} suffix={suffix} />
    </div>
  )
}
