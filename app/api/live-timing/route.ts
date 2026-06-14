import { NextResponse } from 'next/server'

const BASE = 'https://api.openf1.org/v1'

// ── Module-level cache + rate-limit throttle ───────────────────────────────────
// OpenF1 limits: 3 req/s burst, 30 req/min sustained.
// We enforce ≥400 ms between actual OpenF1 fetches so we stay under both limits.
// Stale-while-revalidate: on error/429 we return the last known-good value so
// cached data never disappears due to a transient rate-limit hit.

const _cache = new Map<string, { value: unknown; exp: number }>()
let _lastFetch = 0
let _blocked = false  // True when OpenF1 returns 401 (live session lock-out)

async function cf<T>(path: string, ttlMs: number): Promise<T[]> {
  const now = Date.now()
  const hit = _cache.get(path)
  if (hit && hit.exp > now) return hit.value as T[]  // Fresh cache hit – no delay

  // Throttle: one OpenF1 request every ≥400 ms
  const wait = 400 - (Date.now() - _lastFetch)
  if (wait > 0) await new Promise<void>(r => setTimeout(r, wait))
  _lastFetch = Date.now()

  try {
    const res = await fetch(`${BASE}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 401) {
      _blocked = true                                // OpenF1 live session lock-out
      return (hit?.value as T[]) ?? []
    }
    _blocked = false
    if (!res.ok) return (hit?.value as T[]) ?? []   // Rate-limited? Return stale.
    const data: T[] = await res.json()
    _cache.set(path, { value: data, exp: Date.now() + ttlMs })
    return data
  } catch {
    return (hit?.value as T[]) ?? []                 // Network error? Return stale.
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function latestByDriver<T extends { driver_number: number; date: string }>(
  items: T[],
): Map<number, T> {
  const map = new Map<number, T>()
  for (const item of items) {
    const ex = map.get(item.driver_number)
    if (!ex || item.date > ex.date) map.set(item.driver_number, item)
  }
  return map
}

function fmtGap(gap: number | string | null, position: number): string {
  if (position === 1) return 'LEADER'
  if (gap === null) return '—'
  if (typeof gap === 'string') return gap
  if (gap === 0) return 'LEADER'
  return `+${gap.toFixed(3)}`
}

function fmtInterval(interval: number | string | null, position: number): string {
  if (position === 1) return '—'
  if (interval === null) return '—'
  if (typeof interval === 'string') return interval
  return `+${interval.toFixed(3)}`
}

function fmtLap(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(3).padStart(6, '0')
  return `${m}:${s}`
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  // Reset blocked flag each request so we detect when OpenF1 lifts the lock.
  _blocked = false

  // Fetch sequentially so we never burst-fire more than one request at a time.
  // The 400 ms throttle in cf() keeps us well within the 3 req/s burst limit.

  const sessions = await cf<{
    session_key: number
    session_name: string
    session_type: string
    date_start: string
    date_end: string | null
    circuit_short_name: string
    country_name: string
    year: number
    meeting_name: string
  }>('/sessions?session_key=latest', 120_000) // 2 min

  if (_blocked) {
    return NextResponse.json({ error: 'live_session' })
  }

  if (!sessions.length) {
    return NextResponse.json({ error: 'No session data' }, { status: 503 })
  }

  const session = sessions[0]
  const now = new Date()
  const start = new Date(session.date_start)
  const end = session.date_end
    ? new Date(new Date(session.date_end).getTime() + 90 * 60 * 1000)
    : null
  const isLive = now >= start && (!end || now <= end)
  const sk = session.session_key

  const drivers = await cf<{
    driver_number: number
    full_name: string
    name_acronym: string
    team_name: string
    team_colour: string
    country_code: string
  }>(`/drivers?session_key=${sk}`, 120_000)

  const positions = await cf<{ driver_number: number; position: number; date: string }>(
    `/position?session_key=${sk}`, 10_000)

  const intervals = await cf<{
    driver_number: number
    gap_to_leader: number | string | null
    interval: number | string | null
    date: string
  }>(`/intervals?session_key=${sk}`, 12_000)

  const stints = await cf<{
    driver_number: number
    stint_number: number
    lap_start: number
    lap_end: number | null
    compound: string
    tyre_age_at_start: number
  }>(`/stints?session_key=${sk}`, 30_000)

  const laps = await cf<{
    driver_number: number
    lap_number: number
    lap_duration: number | null
    date_start: string
    is_pit_out_lap: boolean
  }>(`/laps?session_key=${sk}`, 60_000)

  const raceControl = await cf<{
    date: string
    category: string
    message: string
    flag: string | null
    scope: string | null
    driver_number: number | null
    lap_number: number | null
  }>(`/race_control?session_key=${sk}`, 15_000)

  const weather = await cf<{
    air_temperature: number
    track_temperature: number
    rainfall: number
    wind_speed: number
    date: string
  }>(`/weather?session_key=${sk}`, 30_000)

  // ── Aggregate data ─────────────────────────────────────────────────────────

  const latestPositions = latestByDriver(positions)
  const latestIntervals = latestByDriver(intervals)

  const latestLapMap = new Map<number, (typeof laps)[0]>()
  for (const lap of laps) {
    if (lap.is_pit_out_lap || !lap.lap_duration) continue
    const ex = latestLapMap.get(lap.driver_number)
    if (!ex || lap.lap_number > ex.lap_number) latestLapMap.set(lap.driver_number, lap)
  }

  const currentStintMap = new Map<number, (typeof stints)[0]>()
  for (const s of stints) {
    const ex = currentStintMap.get(s.driver_number)
    if (!ex || s.stint_number > ex.stint_number) currentStintMap.set(s.driver_number, s)
  }

  // Pit count = max(stint_number) - 1 per driver (avoids separate /pit endpoint)
  const pitCountMap = new Map<number, number>()
  for (const s of stints) {
    const cur = pitCountMap.get(s.driver_number) ?? 0
    if (s.stint_number > cur) pitCountMap.set(s.driver_number, s.stint_number)
  }
  for (const [dn, maxStint] of pitCountMap) {
    pitCountMap.set(dn, Math.max(0, maxStint - 1))
  }

  const currentLapMap = new Map<number, number>()
  for (const lap of laps) {
    const ex = currentLapMap.get(lap.driver_number) ?? 0
    if (lap.lap_number > ex) currentLapMap.set(lap.driver_number, lap.lap_number)
  }

  const driverMap = new Map(drivers.map(d => [d.driver_number, d]))

  const timing = Array.from(latestPositions.values())
    .sort((a, b) => a.position - b.position)
    .map(pos => {
      const d = driverMap.get(pos.driver_number)
      const iv = latestIntervals.get(pos.driver_number)
      const lap = latestLapMap.get(pos.driver_number)
      const stint = currentStintMap.get(pos.driver_number)
      const pitsCount = pitCountMap.get(pos.driver_number) ?? 0
      const currentLap = currentLapMap.get(pos.driver_number) ?? 0
      const tyreAge = stint
        ? currentLap - stint.lap_start + (stint.tyre_age_at_start ?? 0)
        : 0

      return {
        position: pos.position,
        driverNumber: pos.driver_number,
        name: d?.full_name ?? `#${pos.driver_number}`,
        acronym: d?.name_acronym ?? '???',
        team: d?.team_name ?? '—',
        teamColor: (d?.team_colour ?? '444444').replace('#', ''),
        countryCode: d?.country_code ?? '',
        gap: fmtGap(iv?.gap_to_leader ?? null, pos.position),
        interval: fmtInterval(iv?.interval ?? null, pos.position),
        lastLap: fmtLap(lap?.lap_duration ?? null),
        compound: stint?.compound ?? 'UNKNOWN',
        tyreAge: Math.max(0, tyreAge),
        pits: pitsCount,
      }
    })

  const rc = [...raceControl]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
    .map(m => ({
      time: m.date,
      message: m.message,
      flag: m.flag,
      category: m.category,
      lap: m.lap_number,
    }))

  const wx = weather.at(-1)

  return NextResponse.json({
    isLive,
    sessionName: session.session_name,
    meetingName: session.meeting_name ?? '',
    circuit: session.circuit_short_name ?? '',
    country: session.country_name ?? '',
    year: session.year,
    timing,
    raceControl: rc,
    weather: wx
      ? {
          trackTemp: Math.round(wx.track_temperature),
          airTemp: Math.round(wx.air_temperature),
          rainfall: wx.rainfall,
          windSpeed: Math.round(wx.wind_speed),
        }
      : null,
    lastUpdated: new Date().toISOString(),
  })
}
