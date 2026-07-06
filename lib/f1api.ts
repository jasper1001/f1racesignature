/**
 * Live F1 data from the Jolpica API (the maintained successor to Ergast).
 * All data returned here is REAL, sourced from official F1 timing — nothing
 * is hardcoded. Responses are revalidated hourly via Next.js fetch caching.
 *
 * Docs: https://github.com/jolpica/jolpica-f1
 */

import { SEASON } from '@/lib/site'

const BASE = 'https://api.jolpi.ca/ergast/f1'
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
  positionText?: string
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

// ── Pole positions (qualifying P1) per round ────────────────────────────────

export interface RacePole {
  round: string
  raceName: string
  date: string
  driver: ApiDriver
  constructorId: string
}

// One row per completed qualifying session — the compact /qualifying/1 endpoint
// returns only the P1 driver of each round (same trick as getSeasonPodiums).
export async function getSeasonPoles(year: string): Promise<RacePole[]> {
  type QualiRace = Race & { QualifyingResults?: { Driver: ApiDriver; Constructor: ApiConstructor }[] }
  const data = await getJson<{ MRData: { RaceTable: { Races: QualiRace[] } } }>(
    `${year}/qualifying/1.json?limit=100`,
  )
  const out: RacePole[] = []
  for (const r of data?.MRData?.RaceTable?.Races ?? []) {
    const p1 = r.QualifyingResults?.[0]
    if (p1) {
      out.push({
        round: r.round,
        raceName: r.raceName,
        date: r.date,
        driver: p1.Driver,
        constructorId: p1.Constructor.constructorId,
      })
    }
  }
  return out.sort((a, b) => Number(a.round) - Number(b.round))
}

// ── Current grid (for pick lists) ────────────────────────────────────────────

export interface GridDriver {
  driverId: string
  name: string
  code?: string
  constructorId: string
  teamName: string
}

// The season's drivers with their current team, ordered by championship position
// (standings carry the constructor). Falls back to the plain driver list for the
// pre-season window when no standings exist yet.
export async function getGridDrivers(): Promise<GridDriver[]> {
  const { standings } = await getDriverStandings()
  if (standings.length > 0) {
    return standings.map((s) => {
      const team = s.Constructors[s.Constructors.length - 1]
      return {
        driverId: s.Driver.driverId,
        name: `${s.Driver.givenName} ${s.Driver.familyName}`,
        code: s.Driver.code,
        constructorId: team?.constructorId ?? '',
        teamName: team?.name ?? '',
      }
    })
  }
  const data = await getJson<{ MRData: { DriverTable: { Drivers: ApiDriver[] } } }>(
    `${SEASON}/drivers.json?limit=100`,
  )
  return (data?.MRData?.DriverTable?.Drivers ?? []).map((d) => ({
    driverId: d.driverId,
    name: `${d.givenName} ${d.familyName}`,
    code: d.code,
    constructorId: '',
    teamName: '',
  }))
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

// ── Per-driver, per-race points breakdown ─────────────────────────────────────

export interface DriverRaceEntry {
  round: string
  raceName: string
  country: string
  position: string // finishing position ("18") or classification code ("R", "D")
  status: string // "Finished", "+1 Lap", "Accident", "Engine", …
  points: number // total points from this round (race + sprint)
  racePoints: number
  sprintPoints: number
  hasSprint: boolean
  dnf: boolean // did not finish / not classified
}

// A driver is "DNF" when the API classifies them with a non-numeric positionText
// ("R" retired, "D" disqualified, "E" excluded, "W" withdrawn, "F" failed to qualify).
function isDnf(positionText: string | undefined, status: string): boolean {
  if (positionText && /^\d+$/.test(positionText)) return false
  if (status === 'Finished' || /^\+\d+ Lap/.test(status)) return false
  return true
}

// Fetch every result row for a season, following pagination (Jolpica caps limit at 100).
async function fetchAllResultRaces(
  endpoint: 'results' | 'sprint',
  year: string,
): Promise<Race[]> {
  type Page = { MRData: { total: string; RaceTable: { Races: Race[] } } }
  const url = (offset: number) => `${year}/${endpoint}.json?limit=100&offset=${offset}`

  const first = await getJson<Page>(url(0))
  if (!first) return []
  const total = Number(first.MRData.total) || 0
  const races: Race[] = [...(first.MRData.RaceTable.Races ?? [])]

  const offsets: number[] = []
  for (let o = 100; o < total; o += 100) offsets.push(o)
  const rest = await Promise.all(offsets.map((o) => getJson<Page>(url(o))))
  for (const page of rest) {
    if (page) races.push(...(page.MRData.RaceTable.Races ?? []))
  }
  return races
}

// Build a map of driverId → their round-by-round scoring for the season. Includes
// rounds where the driver retired (DNF) or scored zero, and folds in sprint points
// so the per-round totals reconcile with the championship standings.
export async function getSeasonDriverBreakdowns(
  year: string,
): Promise<Record<string, DriverRaceEntry[]>> {
  const [raceRaces, sprintRaces] = await Promise.all([
    fetchAllResultRaces('results', year),
    fetchAllResultRaces('sprint', year),
  ])

  const byDriver = new Map<string, Map<string, DriverRaceEntry>>()

  const ensure = (driverId: string, race: Race): DriverRaceEntry => {
    let rounds = byDriver.get(driverId)
    if (!rounds) {
      rounds = new Map()
      byDriver.set(driverId, rounds)
    }
    let entry = rounds.get(race.round)
    if (!entry) {
      entry = {
        round: race.round,
        raceName: race.raceName,
        country: race.Circuit.Location.country,
        position: '',
        status: '',
        points: 0,
        racePoints: 0,
        sprintPoints: 0,
        hasSprint: false,
        dnf: false,
      }
      rounds.set(race.round, entry)
    }
    return entry
  }

  for (const race of raceRaces) {
    for (const res of race.Results ?? []) {
      const entry = ensure(res.Driver.driverId, race)
      entry.position = res.positionText ?? res.position
      entry.status = res.status
      entry.racePoints = Number(res.points) || 0
      entry.points += entry.racePoints
      entry.dnf = isDnf(res.positionText, res.status)
    }
  }

  for (const race of sprintRaces) {
    for (const res of (race as Race & { SprintResults?: RaceResult[] }).SprintResults ?? []) {
      const entry = ensure(res.Driver.driverId, race)
      entry.sprintPoints = Number(res.points) || 0
      entry.points += entry.sprintPoints
      entry.hasSprint = true
    }
  }

  const out: Record<string, DriverRaceEntry[]> = {}
  for (const [driverId, rounds] of byDriver) {
    out[driverId] = [...rounds.values()].sort((a, b) => Number(a.round) - Number(b.round))
  }
  return out
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
