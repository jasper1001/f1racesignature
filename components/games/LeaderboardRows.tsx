'use client'

import { motion } from 'framer-motion'
import { flagEmoji } from '@/lib/countries'
import type { ScoreRow } from '@/lib/leaderboard'

// Shared board body — the ranked rows + the player's own row when outside the top.
// Used by the in-game submit card, the per-game page board, and the hub.
export function LeaderboardRows({
  rows, mine, accent, suffix = '',
}: {
  rows: ScoreRow[]
  mine: { row: ScoreRow; rank: number } | null
  accent: string
  suffix?: string
}) {
  const inTop = mine && rows.some((r) => r.id === mine.row.id)
  return (
    <div className="space-y-1">
      {rows.length === 0 && (
        <p className="text-xs text-[#1a1712]/45 text-center py-3 font-mono">No scores yet — be the first!</p>
      )}
      {rows.map((r, i) => {
        const you = mine?.row.id === r.id
        return (
          <motion.div key={r.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
            style={you ? { background: `${accent}14`, border: `1px solid ${accent}40` } : { border: '1px solid transparent' }}>
            <span className="w-6 text-right font-mono font-bold tabular-nums" style={{ color: i < 3 ? accent : '#1a171255' }}>{i + 1}</span>
            <span className="flex-1 min-w-0 truncate text-[#1a1712] font-medium">
              {r.country && <span className="mr-1">{flagEmoji(r.country)}</span>}
              {r.username}{you && <span className="text-[10px] font-mono ml-1.5" style={{ color: accent }}>YOU</span>}
              {(r.country || r.fav_team || r.fav_driver) && (
                <span className="block text-[10px] font-mono text-[#1a1712]/50 truncate mt-0.5">
                  {r.country && <span className="text-[#1a1712]/70">{flagEmoji(r.country)} {r.country}</span>}
                  {r.country && (r.fav_driver || r.fav_team) && ' · '}
                  {r.fav_driver && <><span className="opacity-60">fav. driver</span> {r.fav_driver}</>}
                  {r.fav_driver && r.fav_team && ' · '}
                  {r.fav_team && <><span className="opacity-60">team</span> {r.fav_team}</>}
                </span>
              )}
            </span>
            <span className="font-mono font-bold tabular-nums text-[#1a1712]">{r.score}{suffix}</span>
          </motion.div>
        )
      })}
      {mine && !inTop && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm mt-1"
          style={{ background: `${accent}14`, border: `1px solid ${accent}40` }}>
          <span className="w-6 text-right font-mono font-bold tabular-nums" style={{ color: accent }}>{mine.rank}</span>
          <span className="flex-1 min-w-0 truncate text-[#1a1712] font-medium">
            {mine.row.country && <span className="text-[#1a1712]/70 mr-1.5">{flagEmoji(mine.row.country)} {mine.row.country}</span>}
            {mine.row.username}<span className="text-[10px] font-mono ml-1.5" style={{ color: accent }}>YOU</span>
          </span>
          <span className="font-mono font-bold tabular-nums text-[#1a1712]">{mine.row.score}{suffix}</span>
        </div>
      )}
    </div>
  )
}
