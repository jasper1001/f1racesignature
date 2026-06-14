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
