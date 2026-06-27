'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchDrivers } from '@/lib/data'
import {
  submitScore, getLeaderboard, getMyEntry, loadProfile, saveProfile,
  usernameError, cleanUsername, supabaseEnabled, type ScoreRow,
} from '@/lib/leaderboard'
import { COUNTRIES, flagEmoji } from '@/lib/countries'

interface Props {
  gameId: string
  score: number
  /** Text after the score, e.g. '%' or 's'. */
  suffix?: string
  /** true = lower score wins (times). Default false = higher wins. */
  ascending?: boolean
  accent?: string
  meta?: Record<string, unknown>
}

export function Leaderboard(props: Props) {
  if (!supabaseEnabled) return null   // no-op until the project is configured
  return <LeaderboardInner {...props} />
}

function LeaderboardInner({ gameId, score, suffix = '', ascending = false, accent = '#ec4899', meta }: Props) {
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers })
  const teams = useMemo(() => Array.from(new Set(drivers.map((d) => d.team).filter(Boolean))).sort(), [drivers])

  const saved = useMemo(loadProfile, [])
  const [name, setName] = useState(saved?.username ?? '')
  const [team, setTeam] = useState(saved?.favTeam ?? '')
  const [driver, setDriver] = useState(saved?.favDriver ?? '')
  const [country, setCountry] = useState(saved?.country ?? '')
  const [showFavs, setShowFavs] = useState(false)

  const [rows, setRows] = useState<ScoreRow[]>([])
  const [mine, setMine] = useState<{ row: ScoreRow; rank: number } | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [err, setErr] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [board, my] = await Promise.all([
      getLeaderboard(gameId, { limit: 10, ascending }),
      getMyEntry(gameId, { ascending }),
    ])
    setRows(board); setMine(my)
  }, [gameId, ascending])

  useEffect(() => { refresh().catch(() => {}) }, [refresh])

  const submit = async () => {
    const e = usernameError(name)
    if (e) { setErr(e); return }
    setStatus('submitting'); setErr(null)
    try {
      const profile = { username: cleanUsername(name), favTeam: team || null, favDriver: driver || null, country: country || null }
      saveProfile(profile)
      await submitScore(gameId, score, profile, meta)
      await refresh()
      setStatus('done')
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not submit'); setStatus('error')
    }
  }

  const inTop = mine && rows.some((r) => r.id === mine.row.id)

  return (
    <div className="rounded-2xl border border-[#dcd5c6] bg-[#f4f1ea] p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#1a1712]/55">Global Leaderboard</p>
        {mine && <span className="text-[11px] font-mono text-[#1a1712]/70">Your rank: <b style={{ color: accent }}>#{mine.rank}</b></span>}
      </div>

      {/* Submit card */}
      {status !== 'done' && (
        <div className="rounded-xl border border-[#e2dccd] bg-[#fbf9f4] p-3 space-y-3">
          <p className="text-sm text-[#1a1712]">
            You scored <b style={{ color: accent }}>{score}{suffix}</b> — add your name to the board.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            className="w-full px-3 py-2 rounded-lg border border-[#dcd5c6] bg-white text-[#1a1712] text-sm outline-none focus:border-[#c4bca8]"
          />
          {!showFavs ? (
            <button onClick={() => setShowFavs(true)} className="text-[11px] font-mono text-[#1a1712]/55 hover:text-[#1a1712] underline">
              + add country / favourites (optional)
            </button>
          ) : (
            <div className="space-y-2">
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-[#dcd5c6] bg-white text-[#1a1712] text-sm">
                <option value="">Country…</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={team} onChange={(e) => setTeam(e.target.value)}
                  className="px-2 py-2 rounded-lg border border-[#dcd5c6] bg-white text-[#1a1712] text-sm">
                  <option value="">Favourite team…</option>
                  {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={driver} onChange={(e) => setDriver(e.target.value)}
                  className="px-2 py-2 rounded-lg border border-[#dcd5c6] bg-white text-[#1a1712] text-sm">
                  <option value="">Favourite driver…</option>
                  {drivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
          )}
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button
            onClick={submit}
            disabled={status === 'submitting'}
            className="w-full py-2.5 rounded-lg text-black font-semibold text-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-40"
            style={{ background: accent }}
          >
            {status === 'submitting' ? 'Submitting…' : mine ? 'Update my score' : 'Submit my score'}
          </button>
        </div>
      )}
      {status === 'done' && (
        <p className="text-sm text-center text-[#1a1712]/75">Saved! {mine && <>You&apos;re <b style={{ color: accent }}>#{mine.rank}</b> in the world.</>}</p>
      )}

      {/* Board */}
      <div className="space-y-1">
        {rows.length === 0 && <p className="text-xs text-[#1a1712]/45 text-center py-2 font-mono">Be the first on the board.</p>}
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
        {/* Player's row if outside the top 10 */}
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
    </div>
  )
}
