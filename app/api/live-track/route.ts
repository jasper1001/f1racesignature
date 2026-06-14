import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://api.openf1.org/v1'

// ── Module-level cache + rate-limit throttle ───────────────────────────────────
// Same strategy as live-timing: 400 ms minimum between OpenF1 fetches,
// stale-while-revalidate so a 429 never wipes out good data.

const _cache = new Map<string, { value: unknown; exp: number }>()
let _lastFetch = 0

async function cf<T>(path: string, ttlMs: number): Promise<T[]> {
  const now = Date.now()
  const hit = _cache.get(path)
  if (hit && hit.exp > now) return hit.value as T[]

  const wait = 400 - (Date.now() - _lastFetch)
  if (wait > 0) await new Promise<void>(r => setTimeout(r, wait))
  _lastFetch = Date.now()

  try {
    const res = await fetch(`${BASE}${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return (hit?.value as T[]) ?? []
    const data: T[] = await res.json()
    _cache.set(path, { value: data, exp: Date.now() + ttlMs })
    return data
  } catch {
    return (hit?.value as T[]) ?? []
  }
}

type Loc = { driver_number: number; x: number; y: number; date: string }
type Driver = { driver_number: number; name_acronym: string; team_colour: string }

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'positions'

  const sessions = await cf<{ session_key: number; date_start: string }>(
    '/sessions?session_key=latest', 120_000,
  )
  if (!sessions.length) {
    return NextResponse.json({ error: 'No session' }, { status: 503 })
  }
  const sk = sessions[0].session_key

  // ── Track outline ──────────────────────────────────────────────────────────
  if (type === 'outline') {
    const from = new Date(Date.now() - 120_000)
    const raw = await cf<Loc>(
      `/location?session_key=${sk}&date%3E=${from.toISOString()}`,
      30_000,
    )
    const points = raw.filter((_, i) => i % 6 === 0).map(l => ({ x: l.x, y: l.y }))

    if (!points.length) return NextResponse.json({ points: [], bounds: null })

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    return NextResponse.json({
      points,
      bounds: {
        minX: Math.min(...xs), maxX: Math.max(...xs),
        minY: Math.min(...ys), maxY: Math.max(...ys),
      },
    })
  }

  // ── Current car positions ──────────────────────────────────────────────────
  const from = new Date(Date.now() - 5000)
  const rawLoc = await cf<Loc>(
    `/location?session_key=${sk}&date%3E=${from.toISOString()}`, 8_000,
  )
  const drivers = await cf<Driver>(`/drivers?session_key=${sk}`, 120_000)

  const driverMap = new Map(drivers.map(d => [d.driver_number, d]))

  const latest = new Map<number, Loc>()
  for (const l of rawLoc) {
    const ex = latest.get(l.driver_number)
    if (!ex || l.date > ex.date) latest.set(l.driver_number, l)
  }

  const cars = Array.from(latest.values()).map(l => {
    const d = driverMap.get(l.driver_number)
    return {
      driverNumber: l.driver_number,
      x: l.x,
      y: l.y,
      acronym: d?.name_acronym ?? String(l.driver_number),
      teamColor: (d?.team_colour ?? '444444').replace('#', ''),
    }
  })

  return NextResponse.json({ cars, updatedAt: new Date().toISOString() })
}
