// Builds the shareable season-calendar card spec. Plain serializable data, so
// server components can construct it and hand it to the <ShareCardButton>
// client leaf (rendering happens client-side in lib/resultCards.ts).

import type { Race } from '@/lib/f1api'
import type { ScheduleCardSpec } from '@/lib/resultCards'

const shortName = (raceName: string) => raceName.replace('Grand Prix', 'GP')

const fmtDate = (date: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  )

// Same cutoff ScheduleView uses: the race has finished ~2.5h after lights out.
const raceOver = (race: Race, now: number) =>
  now > new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T14:00:00Z`).getTime() + 2.5 * 60 * 60 * 1000

export function buildScheduleCard(races: Race[], season: string): ScheduleCardSpec | null {
  if (races.length === 0) return null

  const now = Date.now()
  let nextMarked = false
  const rows = races.map((race) => {
    const past = raceOver(race, now)
    let status: 'past' | 'next' | 'upcoming' = past ? 'past' : 'upcoming'
    if (!past && !nextMarked) {
      status = 'next'
      nextMarked = true
    }
    return { round: race.round, name: shortName(race.raceName), date: fmtDate(race.date), status }
  })

  const nextIdx = rows.findIndex((r) => r.status === 'next')
  const next = nextIdx === -1 ? null : races[nextIdx]

  return {
    type: 'schedule',
    eyebrow: `Formula 1 ${season} · Race Calendar`,
    title: `F1 ${season} Race Schedule`,
    sub: next
      ? `${races.length} rounds · Next: ${shortName(next.raceName)} — ${fmtDate(next.date)}`
      : `${races.length} rounds · Season complete`,
    credit: 'Session times at f1racesignature.site/schedule',
    rows,
  }
}

export function scheduleShareText(races: Race[], season: string, siteUrl: string): string {
  const now = Date.now()
  const next = races.find((race) => !raceOver(race, now))
  const nextPart = next ? ` · Next up: ${shortName(next.raceName)}, ${fmtDate(next.date)}` : ''
  return `F1 ${season} race calendar — ${races.length} rounds${nextPart} 🏁 ${siteUrl}/schedule`
}
