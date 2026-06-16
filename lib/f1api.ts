/**
 * Live F1 data from the Jolpica API (the maintained successor to Ergast).
 * All data returned here is REAL, sourced from official F1 timing — nothing
 * is hardcoded. Responses are revalidated hourly via Next.js fetch caching.
 *
 * Docs: https://github.com/jolpica/jolpica-f1
 */

const BASE = 'https://api.jolpi.ca/ergast/f1'
const SEASON = '2026'
const REVALIDATE = 3600 // 1 hour

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`, { next: { revalidate: REVALIDATE } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiDriver {
  driverId: string
  permanentNumber?: string
  code?: string
  givenName: string
  familyName: string
  nationality: string
}

export interface ApiConstructor {
  constructorId: string
  name: string
  nationality: string
}

export interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: ApiDriver
  Constructors: ApiConstructor[]
}

export interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: ApiConstructor
}

export interface RaceResult {
  position: string
  points: string
  Driver: ApiDriver
  Constructor: ApiConstructor
  grid: string
  status: string
  Time?: { time: string }
}

export interface SessionTime {
  date: string
  time?: string
}

export interface Race {
  round: string
  raceName: string
  date: string
  time?: string
  Circuit: {
    circuitId: string
    circuitName: string
    Location: { locality: string; country: string }
  }
  Results?: RaceResult[]
  // Session times (present in schedule endpoint)
  FirstPractice?: SessionTime
  SecondPractice?: SessionTime
  ThirdPractice?: SessionTime
  SprintQualifying?: SessionTime
  Sprint?: SessionTime
  Qualifying?: SessionTime
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

export async function getSeason(): Promise<string> {
  return SEASON
}

export async function getDriverStandings(): Promise<{ round: string; standings: DriverStanding[] }> {
  const data = await getJson<{
    MRData: { StandingsTable: { StandingsLists: { round: string; DriverStandings: DriverStanding[] }[] } }
  }>(`${SEASON}/driverStandings.json`)
  const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]
  return { round: list?.round ?? '0', standings: list?.DriverStandings ?? [] }
}

export async function getConstructorStandings(): Promise<ConstructorStanding[]> {
  const data = await getJson<{
    MRData: { StandingsTable: { StandingsLists: { ConstructorStandings: ConstructorStanding[] }[] } }
  }>(`${SEASON}/constructorStandings.json`)
  return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
}

export async function getSchedule(): Promise<Race[]> {
  const data = await getJson<{ MRData: { RaceTable: { Races: Race[] } } }>(`${SEASON}.json`)
  return data?.MRData?.RaceTable?.Races ?? []
}

export interface RacePodium {
  round: string
  raceName: string
  date: string
  circuitName: string
  country: string
  podium: RaceResult[] // finishers P1–P3, ordered by position
}

// Per-race podiums for a whole season. The Jolpica API caps `limit` at 100, so
// rather than paginate the full results we hit the compact position endpoints
// (/results/1, /2, /3) — each returns one row per race — and merge them by round.
export async function getSeasonPodiums(year: string): Promise<RacePodium[]> {
  const pages = await Promise.all(
    [1, 2, 3].map((p) =>
      getJson<{ MRData: { RaceTable: { Races: Race[] } } }>(`${year}/results/${p}.json`),
    ),
  )

  const byRound = new Map<string, RacePodium>()
  for (const page of pages) {
    for (const r of page?.MRData?.RaceTable?.Races ?? []) {
      let entry = byRound.get(r.round)
      if (!entry) {
        entry = {
          round: r.round,
          raceName: r.raceName,
          date: r.date,
          circuitName: r.Circuit.circuitName,
          country: r.Circuit.Location.country,
          podium: [],
        }
        byRound.set(r.round, entry)
      }
      if (r.Results?.[0]) entry.podium.push(r.Results[0])
    }
  }

  return [...byRound.values()]
    .map((e) => ({ ...e, podium: e.podium.sort((a, b) => Number(a.position) - Number(b.position)) }))
    .sort((a, b) => Number(b.round) - Number(a.round)) // most recent first
}

// ── Past-season final standings (completed years) ──────────────────────────────

export interface PastSeason {
  year: string
  drivers: DriverStanding[]
  constructors: ConstructorStanding[]
  podiums: RacePodium[]
}

export async function getPastSeason(year: string): Promise<PastSeason> {
  const [driverData, constructorData, podiums] = await Promise.all([
    getJson<{ MRData: { StandingsTable: { StandingsLists: { DriverStandings: DriverStanding[] }[] } } }>(
      `${year}/driverStandings.json`,
    ),
    getJson<{ MRData: { StandingsTable: { StandingsLists: { ConstructorStandings: ConstructorStanding[] }[] } } }>(
      `${year}/constructorStandings.json`,
    ),
    getSeasonPodiums(year),
  ])
  return {
    year,
    drivers: driverData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [],
    constructors: constructorData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [],
    podiums,
  }
}

export async function getLastRaceResults(): Promise<Race | null> {
  const data = await getJson<{ MRData: { RaceTable: { Races: Race[] } } }>(
    `${SEASON}/last/results.json`,
  )
  return data?.MRData?.RaceTable?.Races?.[0] ?? null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEAM_COLORS: Record<string, string> = {
  red_bull: '#1e41ff',
  ferrari: '#dc0000',
  mercedes: '#00d2be',
  mclaren: '#ff8000',
  aston_martin: '#229971',
  alpine: '#0093cc',
  williams: '#005aff',
  rb: '#6692ff',
  sauber: '#52e252',
  haas: '#b6babd',
  audi: '#bb0a30',
  cadillac: '#d4a017',
}

export function teamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] ?? '#d4a017'
}

export function formatRaceDate(date: string): string {
  try {
    return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return date
  }
}

export function isPast(date: string): boolean {
  return new Date(date + 'T23:59:59Z').getTime() < Date.now()
}
