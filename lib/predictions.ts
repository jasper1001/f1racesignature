'use client'

import { getSupabase, ensureAnonSession, supabaseEnabled } from './supabase'

// ── Race Predictions league ──────────────────────────────────────────────────
// Players pick pole + the podium before each round's qualifying; the server
// (submit_prediction RPC, migration 011) rejects picks after the lock time.
// Points are never stored — they're derived here by comparing locked picks
// against real results from the Jolpica API, so scoring can't be spoofed.

export interface PredictionRow {
  id: string
  season: string
  round: number
  player_id: string
  username: string
  pole: string
  p1: string
  p2: string
  p3: string
  country: string | null
  created_at: string
  updated_at: string
}

/** Real outcome of a round (driverIds), assembled server-side from the F1 API. */
export interface RoundActual {
  round: number
  raceName: string
  pole?: string
  podium?: [string, string, string]
}

// ── Scoring (pure) ───────────────────────────────────────────────────────────
// Pole exact: 10. Podium: 10 per driver in the exact spot, 5 for the right
// driver in the wrong podium spot. Max 40 per weekend.

export const POINTS = { pole: 10, exact: 10, onPodium: 5, max: 40 } as const

export interface RoundScore {
  total: number
  polePts: number
  podiumPts: number
  exactHits: number
}

export function scoreRound(
  pick: Pick<PredictionRow, 'pole' | 'p1' | 'p2' | 'p3'>,
  actual: RoundActual,
): RoundScore | null {
  if (!actual.podium && !actual.pole) return null
  const polePts = actual.pole && actual.pole === pick.pole ? POINTS.pole : 0
  let podiumPts = 0
  let exactHits = 0
  if (actual.podium) {
    const picks = [pick.p1, pick.p2, pick.p3]
    picks.forEach((driverId, i) => {
      if (actual.podium![i] === driverId) {
        podiumPts += POINTS.exact
        exactHits += 1
      } else if (actual.podium!.includes(driverId)) {
        podiumPts += POINTS.onPodium
      }
    })
  }
  return { total: polePts + podiumPts, polePts, podiumPts, exactHits }
}

export interface LeagueEntry {
  playerId: string
  username: string
  country: string | null
  total: number
  exactHits: number
  rounds: number // rounds that have been scored
}

/** Season table: every player's derived total, ranked. */
export function buildLeagueTable(
  rows: PredictionRow[],
  actuals: Map<number, RoundActual>,
): LeagueEntry[] {
  const byPlayer = new Map<string, LeagueEntry>()
  for (const row of rows) {
    const actual = actuals.get(row.round)
    const score = actual ? scoreRound(row, actual) : null
    let entry = byPlayer.get(row.player_id)
    if (!entry) {
      entry = { playerId: row.player_id, username: row.username, country: row.country, total: 0, exactHits: 0, rounds: 0 }
      byPlayer.set(row.player_id, entry)
    }
    // keep the profile from the most recent row
    entry.username = row.username
    entry.country = row.country ?? entry.country
    if (score) {
      entry.total += score.total
      entry.exactHits += score.exactHits
      entry.rounds += 1
    }
  }
  return [...byPlayer.values()].sort(
    (a, b) => b.total - a.total || b.exactHits - a.exactHits || a.username.localeCompare(b.username),
  )
}

// ── Supabase calls ───────────────────────────────────────────────────────────

export { supabaseEnabled }

/** Submit (or revise) picks for a round. Throws if the round is locked. */
export async function submitPrediction(
  season: string,
  round: number,
  picks: { pole: string; p1: string; p2: string; p3: string },
  username: string,
  country?: string | null,
): Promise<PredictionRow | null> {
  const sb = getSupabase()
  if (!sb) return null
  await ensureAnonSession()
  const { data, error } = await sb.rpc('submit_prediction', {
    p_season: season,
    p_round: round,
    p_pole: picks.pole,
    p_p1: picks.p1,
    p_p2: picks.p2,
    p_p3: picks.p3,
    p_username: username,
    p_country: country ?? null,
  })
  if (error) throw error
  return data as PredictionRow
}

/** All of this player's picks for the season (round-by-round history). */
export async function getMyPredictions(season: string): Promise<PredictionRow[]> {
  const sb = getSupabase()
  if (!sb) return []
  const uid = await ensureAnonSession()
  if (!uid) return []
  const { data, error } = await sb
    .from('predictions')
    .select('*')
    .eq('season', season)
    .eq('player_id', uid)
    .order('round', { ascending: true })
  if (error) throw error
  return (data ?? []) as PredictionRow[]
}

/**
 * Every player's picks for the season, for the derived league table. Capped —
 * if the league outgrows this, move the aggregation into a Postgres view.
 */
export async function getSeasonPredictions(season: string): Promise<PredictionRow[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('predictions')
    .select('*')
    .eq('season', season)
    .order('round', { ascending: true })
    .limit(5000)
  if (error) throw error
  return (data ?? []) as PredictionRow[]
}
