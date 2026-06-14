import { NextResponse } from 'next/server'

const BASE = 'https://api.openf1.org/v1'

async function o1<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

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

export async function GET() {
  const sessions = await o1<{
    session_key: number
    session_name: string
    session_type: string
    date_start: string
    date_end: string | null
    circuit_short_name: string
    country_name: string
    year: number
    meeting_name: string
  }>('/sessions?session_key=latest')

  if (!sessions.length) {
    return NextResponse.json({ error: 'No session data' }, { status: 503 })
  }

  const session = sessions[0]
  const now = new Date()
  const start = new Date(session.date_start)
  const end = session.date_end ? new Date(new Date(session.date_end).getTime() + 90 * 60 * 1000) : null
  const isLive = now >= start && (!end || now <= end)

  const sk = session.session_key

  const [drivers, positions, intervals, stints, pits, laps, raceControl, weather] =
    await Promise.all([
      o1<{
        driver_number: number
        full_name: string
        name_acronym: string
        team_name: string
        team_colour: string
        country_code: string
      }>(`/drivers?session_key=${sk}`),
      o1<{ driver_number: number; position: number; date: string }>(
        `/position?session_key=${sk}`,
      ),
      o1<{
        driver_number: number
        gap_to_leader: number | string | null
        interval: number | string | null
        date: string
      }>(`/intervals?session_key=${sk}`),
      o1<{
        driver_number: number
        stint_number: number
        lap_start: number
        lap_end: number | null
        compound: string
        tyre_age_at_start: number
      }>(`/stints?session_key=${sk}`),
      o1<{ driver_number: number; lap_number: number; pit_duration: number | null }>(
        `/pit?session_key=${sk}`,
      ),
      o1<{
        driver_number: number
        lap_number: number
        lap_duration: number | null
        date_start: string
        is_pit_out_lap: boolean
      }>(`/laps?session_key=${sk}`),
      o1<{
        date: string
        category: string
        message: string
        flag: string | null
        scope: string | null
        driver_number: number | null
        lap_number: number | null
      }>(`/race_control?session_key=${sk}`),
      o1<{
        air_temperature: number
        track_temperature: number
        rainfall: number
        wind_speed: number
        date: string
      }>(`/weather?session_key=${sk}`),
    ])

  const latestPositions = latestByDriver(positions)
  const latestIntervals = latestByDriver(intervals)

  // Latest valid lap per driver
  const latestLapMap = new Map<number, (typeof laps)[0]>()
  for (const lap of laps) {
    if (lap.is_pit_out_lap || !lap.lap_duration) continue
    const ex = latestLapMap.get(lap.driver_number)
    if (!ex || lap.lap_number > ex.lap_number) latestLapMap.set(lap.driver_number, lap)
  }

  // Current stint (highest stint_number) per driver
  const currentStintMap = new Map<number, (typeof stints)[0]>()
  for (const s of stints) {
    const ex = currentStintMap.get(s.driver_number)
    if (!ex || s.stint_number > ex.stint_number) currentStintMap.set(s.driver_number, s)
  }

  // Pit count per driver
  const pitCountMap = new Map<number, number>()
  for (const p of pits) pitCountMap.set(p.driver_number, (pitCountMap.get(p.driver_number) ?? 0) + 1)

  // Current lap number per driver
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
