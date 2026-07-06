'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  supabaseEnabled,
  submitPrediction,
  getMyPredictions,
  getSeasonPredictions,
  scoreRound,
  buildLeagueTable,
  POINTS,
  type PredictionRow,
  type RoundActual,
  type LeagueEntry,
} from '@/lib/predictions'
import { loadProfile, saveProfile } from '@/lib/leaderboard'
import { generateRacerName, isRacerName } from '@/lib/racerName'
import { COUNTRIES, flagEmoji } from '@/lib/countries'
import { ShareCardButton } from '@/components/ShareCardButton'
import type { PredictionCardSpec } from '@/lib/resultCards'
import { SITE_URL } from '@/lib/site'

export interface DriverOption {
  id: string
  name: string
  team: string
  color: string
}

export interface NextRound {
  round: number
  raceName: string
  circuitName: string
  country: string
  lockIso: string
  hasSprint: boolean
}

interface Props {
  season: string
  next: NextRound | null
  drivers: DriverOption[]
  actuals: RoundActual[]
  /** driverId → display name, covers past podium/pole drivers not on the current grid. */
  driverNames: Record<string, string>
}

// Ticks once a second so the lock countdown stays live.
function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, '0')}s`
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

export function PredictionsClient({ season, next, drivers, actuals, driverNames }: Props) {
  const now = useNow()
  const lockMs = next ? new Date(next.lockIso).getTime() : 0
  const locked = !next || now >= lockMs

  const actualsByRound = useMemo(() => {
    const map = new Map<number, RoundActual>()
    for (const a of actuals) map.set(a.round, a)
    return map
  }, [actuals])

  // ── profile (shared with the game leaderboards) ──
  const saved = useMemo(loadProfile, [])
  const [name, setName] = useState(saved && isRacerName(saved.username) ? saved.username : '')
  useEffect(() => { if (!name) setName(generateRacerName()) }, [name])
  const [country, setCountry] = useState(saved?.country ?? '')

  // ── picks ──
  const [pole, setPole] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [p3, setP3] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [err, setErr] = useState<string | null>(null)

  // ── my history + league ──
  const [mine, setMine] = useState<PredictionRow[]>([])
  const [league, setLeague] = useState<LeagueEntry[]>([])
  const [loaded, setLoaded] = useState(!supabaseEnabled)

  const refresh = useCallback(async () => {
    const [my, all] = await Promise.all([getMyPredictions(season), getSeasonPredictions(season)])
    setMine(my)
    setLeague(buildLeagueTable(all, actualsByRound))
  }, [season, actualsByRound])

  useEffect(() => {
    if (supabaseEnabled) refresh().catch(() => {}).finally(() => setLoaded(true))
  }, [refresh])

  // Prefill the form with my saved picks for the open round.
  const myNext = next ? mine.find((r) => r.round === next.round) : undefined
  useEffect(() => {
    if (myNext) {
      setPole(myNext.pole); setP1(myNext.p1); setP2(myNext.p2); setP3(myNext.p3)
    }
  }, [myNext])

  const duplicate = [p1, p2, p3].filter(Boolean).length !== new Set([p1, p2, p3].filter(Boolean)).size
  const complete = Boolean(pole && p1 && p2 && p3 && !duplicate)

  const submit = async () => {
    if (!next || !complete) return
    setStatus('submitting'); setErr(null)
    try {
      // keep the shared profile in sync (favourites from the games are preserved)
      saveProfile({ ...(saved ?? { username: name }), username: name, country: country || null })
      await submitPrediction(season, next.round, { pole, p1, p2, p3 }, name, country || null)
      await refresh()
      setStatus('done')
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not save your picks')
      setStatus('error')
    }
  }

  const displayName = (driverId: string) => driverNames[driverId] ?? driverId

  const myPlayerId = mine[0]?.player_id ?? null
  const myRank = myPlayerId ? league.findIndex((e) => e.playerId === myPlayerId) + 1 : 0
  const scoredMine = [...mine]
    .sort((a, b) => b.round - a.round)
    .map((row) => ({ row, actual: actualsByRound.get(row.round) }))

  return (
    <div className="space-y-16">
      {/* ── This weekend's picks ── */}
      <section>
        <SectionHeading
          eyebrow="This Weekend"
          title={next ? next.raceName : 'Season complete'}
          sub={
            next
              ? `${next.circuitName} · Round ${next.round}${next.hasSprint ? ' · Sprint weekend' : ''}`
              : 'No more rounds to predict this season — final league table below.'
          }
        />

        {next && (
          <div className="mt-6 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 md:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-white/65 text-sm">
                {locked
                  ? 'Qualifying has started — picks for this round are locked.'
                  : 'Pick pole position and the podium. You can change your mind until qualifying starts.'}
              </p>
              <span
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider ${
                  locked ? 'border-[#333333] text-white/65' : 'border-[#d4a017]/40 text-[#d4a017]'
                }`}
              >
                {locked ? 'Locked' : `Locks in ${formatCountdown(lockMs - now)}`}
              </span>
            </div>

            {!supabaseEnabled ? (
              <p className="text-white/65 text-sm">
                The predictions league is warming up — check back soon to make your picks.
              </p>
            ) : locked ? (
              myNext ? (
                <div>
                  <p className="text-white/65 text-[11px] font-mono uppercase tracking-wider mb-3">Your locked picks</p>
                  <PicksSummary pole={myNext.pole} p1={myNext.p1} p2={myNext.p2} p3={myNext.p3} displayName={displayName} />
                </div>
              ) : (
                <p className="text-white/65 text-sm">
                  You didn&apos;t make picks for this round. The next round opens right after the race.
                </p>
              )
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DriverSelect label="Pole position" value={pole} onChange={setPole} drivers={drivers} />
                  <DriverSelect label="Race winner (P1)" value={p1} onChange={setP1} drivers={drivers} />
                  <DriverSelect label="Second (P2)" value={p2} onChange={setP2} drivers={drivers} />
                  <DriverSelect label="Third (P3)" value={p3} onChange={setP3} drivers={drivers} />
                </div>
                {duplicate && (
                  <p className="text-xs text-red-400">Your podium needs three different drivers.</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="flex-1">
                    <p className="text-white/65 text-[11px] font-mono uppercase tracking-wider mb-1.5">Racer name</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 rounded-lg border border-[#222222] bg-[#060606] text-white text-sm font-mono truncate">
                        {name || '…'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setName(generateRacerName())}
                        title="Generate another name"
                        aria-label="Generate another name"
                        className="px-3 py-2.5 rounded-lg border border-[#222222] bg-[#060606] text-base hover:border-[#333333] active:scale-95 transition-all"
                      >
                        🎲
                      </button>
                    </div>
                  </div>
                  <div className="sm:w-56">
                    <p className="text-white/65 text-[11px] font-mono uppercase tracking-wider mb-1.5">Country (optional)</p>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#222222] bg-[#060606] text-white text-sm"
                    >
                      <option value="">—</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {err && <p className="text-xs text-red-400">{err}</p>}
                {status === 'done' && (
                  <p className="text-sm text-[#d4a017]">
                    Picks saved for the {next.raceName}. Good luck — come back after the race to see your points.
                  </p>
                )}
                <button
                  onClick={submit}
                  disabled={!complete || status === 'submitting'}
                  className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[#d4a017] text-black font-semibold text-sm hover:bg-[#e8b84b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? 'Saving…' : myNext ? 'Update my picks' : 'Lock in my picks'}
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Scoring rules ── */}
      <section>
        <SectionHeading eyebrow="How It Works" title="Scoring" />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RuleCard points={POINTS.pole} title="Pole position" sub="Call the fastest qualifier." />
          <RuleCard points={POINTS.exact} title="Exact podium spot" sub="Right driver, right step — per driver." />
          <RuleCard points={POINTS.onPodium} title="On the podium" sub="Right driver, wrong step." />
        </div>
        <p className="text-white/65 text-xs mt-3">
          Up to {POINTS.max} points per race weekend. Picks lock when qualifying starts
          {next?.hasSprint ? ' (Sprint Qualifying on sprint weekends)' : ''} and are scored automatically
          against the official results.
        </p>
      </section>

      {/* ── My season ── */}
      {supabaseEnabled && scoredMine.length > 0 && (
        <section>
          <SectionHeading
            eyebrow="Your Season"
            title="My Predictions"
            sub={myRank > 0 ? `You're #${myRank} in the league.` : undefined}
          />
          <div className="mt-6 space-y-3">
            {scoredMine.map(({ row, actual }) => {
              const score = actual ? scoreRound(row, actual) : null
              const raceName = actual?.raceName ?? `Round ${row.round}`
              const scoredRows = buildPickRows(row.pole, row.p1, row.p2, row.p3, actual)
                .filter((r): r is PickRow & { result: 'exact' | 'partial' | 'miss' } => r.result !== null)
              const card: PredictionCardSpec | null = score
                ? {
                    type: 'prediction',
                    eyebrow: `Predictions League · ${season}`,
                    title: raceName,
                    sub: 'Pole + podium, picked before qualifying',
                    credit: 'Scored against official results',
                    total: score.total,
                    max: POINTS.max,
                    username: row.username,
                    rank: myRank > 0 ? myRank : undefined,
                    rows: scoredRows.map((r) => ({ label: r.label, pick: displayName(r.pick), result: r.result })),
                  }
                : null
              return (
                <div key={row.round} className="rounded-xl border border-[#161616] bg-[#0a0a0a] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
                    <span className="text-white text-sm font-medium">
                      {raceName.replace('Grand Prix', 'GP')}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider shrink-0">
                      {score ? (
                        <span className="text-[#d4a017]">+{score.total} pts</span>
                      ) : (
                        <span className="text-white/65">Awaiting results</span>
                      )}
                      {card && score && (
                        <ShareCardButton
                          compact
                          spec={card}
                          filename={`f1racesignature-predictions-round-${row.round}.png`}
                          shareText={`I scored ${score.total}/${POINTS.max} predicting the ${raceName} 🏁 Think you can beat that? ${SITE_URL}/predictions`}
                        />
                      )}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <PicksSummary
                      pole={row.pole} p1={row.p1} p2={row.p2} p3={row.p3}
                      displayName={displayName} actual={actual}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── League table ── */}
      <section>
        <SectionHeading
          eyebrow="Season Standings"
          title="Prediction League"
          sub="Every player's points across the whole season, scored against real results."
        />
        <div className="mt-6 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          {!supabaseEnabled || league.length === 0 ? (
            <p className="text-white/65 text-sm text-center px-6 py-12">
              {loaded
                ? 'No predictions yet — be the first on the board this weekend.'
                : 'Loading the league table…'}
            </p>
          ) : (
            <div className="divide-y divide-[#0d0d0d]">
              {league.slice(0, 20).map((entry, i) => {
                const isMe = entry.playerId === myPlayerId
                return (
                  <div
                    key={entry.playerId}
                    className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-[#d4a017]/10' : ''}`}
                  >
                    <span className={`text-sm font-mono font-semibold w-7 text-center shrink-0 ${i < 3 ? 'text-[#d4a017]' : 'text-white/65'}`}>
                      {i + 1}
                    </span>
                    <span className="text-white text-sm font-medium truncate">
                      {entry.country ? `${flagEmoji(entry.country)} ` : ''}{entry.username}
                      {isMe && <span className="text-[#d4a017] text-[10px] font-mono ml-2 uppercase">You</span>}
                    </span>
                    <span className="text-white/65 text-[11px] font-mono ml-auto shrink-0 hidden sm:inline">
                      {entry.rounds} {entry.rounds === 1 ? 'round' : 'rounds'} · {entry.exactHits} exact
                    </span>
                    <span className="text-white font-mono font-semibold text-sm w-16 text-right shrink-0">
                      {entry.total} pts
                    </span>
                  </div>
                )
              })}
              {myRank > 20 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#d4a017]/10">
                  <span className="text-sm font-mono font-semibold w-7 text-center shrink-0 text-white/65">{myRank}</span>
                  <span className="text-white text-sm font-medium truncate">
                    {league[myRank - 1].country ? `${flagEmoji(league[myRank - 1].country!)} ` : ''}
                    {league[myRank - 1].username}
                    <span className="text-[#d4a017] text-[10px] font-mono ml-2 uppercase">You</span>
                  </span>
                  <span className="text-white font-mono font-semibold text-sm ml-auto shrink-0">
                    {league[myRank - 1].total} pts
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-2">{eyebrow}</p>
      <h2 className="text-2xl md:text-3xl text-white font-display">{title}</h2>
      {sub && <p className="text-white/65 text-sm mt-1">{sub}</p>}
    </div>
  )
}

function DriverSelect({
  label, value, onChange, drivers,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  drivers: DriverOption[]
}) {
  return (
    <label className="block">
      <span className="text-white/65 text-[11px] font-mono uppercase tracking-wider block mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-[#222222] bg-[#060606] text-white text-sm"
      >
        <option value="">Pick a driver…</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}{d.team ? ` — ${d.team}` : ''}
          </option>
        ))}
      </select>
    </label>
  )
}

function RuleCard({ points, title, sub }: { points: number; title: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[#161616] bg-[#0a0a0a] p-4">
      <p className="text-[#d4a017] font-mono font-semibold text-xl">+{points}</p>
      <p className="text-white text-sm font-medium mt-1">{title}</p>
      <p className="text-white/65 text-xs mt-1">{sub}</p>
    </div>
  )
}

type PickRow = { label: string; pick: string; result: 'exact' | 'partial' | 'miss' | null }

/** Pole + P1–P3 picks graded against the real outcome (null result = not scored yet). */
function buildPickRows(pole: string, p1: string, p2: string, p3: string, actual?: RoundActual): PickRow[] {
  return [
    { label: 'Pole', pick: pole, result: actual?.pole ? (actual.pole === pole ? 'exact' : 'miss') : null },
    ...[p1, p2, p3].map((pick, i) => ({
      label: `P${i + 1}`,
      pick,
      result: actual?.podium
        ? actual.podium[i] === pick
          ? ('exact' as const)
          : actual.podium.includes(pick)
            ? ('partial' as const)
            : ('miss' as const)
        : null,
    })),
  ]
}

/** One row per pick; when actuals exist, shows hit/miss against the real outcome. */
function PicksSummary({
  pole, p1, p2, p3, displayName, actual,
}: {
  pole: string
  p1: string
  p2: string
  p3: string
  displayName: (id: string) => string
  actual?: RoundActual
}) {
  const rows = buildPickRows(pole, p1, p2, p3, actual)
  const badge = {
    exact: { text: 'Exact', className: 'text-[#22c55e]' },
    partial: { text: 'On podium', className: 'text-[#d4a017]' },
    miss: { text: 'Miss', className: 'text-white/65' },
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-sm">
          <span className="text-white/65 font-mono text-[11px] w-9 shrink-0">{r.label}</span>
          <span className="text-white truncate">{displayName(r.pick)}</span>
          {r.result && (
            <span className={`ml-auto text-[10px] font-mono uppercase tracking-wider shrink-0 ${badge[r.result].className}`}>
              {badge[r.result].text}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
