'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDrivers } from '@/lib/data'
import {
  submitScore, getLeaderboard, getMyEntry, loadProfile, saveProfile,
  cleanUsername, supabaseEnabled, type ScoreRow,
} from '@/lib/leaderboard'
import { generateRacerName, isRacerName } from '@/lib/racerName'
import { COUNTRIES, flagEmoji } from '@/lib/countries'
import { LeaderboardRows } from '@/components/games/LeaderboardRows'

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
  // Keep a saved name only if it's a valid generated racer name; old free-text
  // names (pre-2026-06-28) are dropped so the server doesn't reject them.
  const [name, setName] = useState(saved && isRacerName(saved.username) ? saved.username : '')
  // Generate after mount (client-only, to avoid an SSR hydration mismatch from Math.random).
  useEffect(() => { if (!name) setName(generateRacerName()) }, [name])
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
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg border border-[#dcd5c6] bg-white text-[#1a1712] text-sm font-mono truncate">
              {name || '…'}
            </div>
            <button
              type="button"
              onClick={() => setName(generateRacerName())}
              title="Generate another name"
              aria-label="Generate another name"
              className="px-3 py-2 rounded-lg border border-[#dcd5c6] bg-white text-base hover:bg-[#f4f1ea] active:scale-95 transition-all"
            >
              🎲
            </button>
          </div>
          <p className="text-[11px] text-[#1a1712]/55">Your racer name — tap 🎲 for another.</p>
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
      <LeaderboardRows rows={rows} mine={mine} accent={accent} suffix={suffix} />
    </div>
  )
}
