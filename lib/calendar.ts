import type { Race } from '@/lib/f1api'

const SITE_URL = 'https://f1racesignature.site'

// ── Date formatting ────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// "2026-03-07" + "04:00:00Z" → Date (UTC). Time strings from the API carry a Z.
function raceStart(race: Race): { date: Date; allDay: boolean } {
  if (race.time) {
    const d = new Date(`${race.date}T${race.time}`)
    if (!Number.isNaN(d.getTime())) return { date: d, allDay: false }
  }
  return { date: new Date(`${race.date}T00:00:00Z`), allDay: true }
}

// YYYYMMDDTHHMMSSZ (ICS UTC timestamp)
function icsStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

// YYYYMMDD (all-day / date-only)
function icsDate(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setUTCDate(out.getUTCDate() + days)
  return out
}

// Escape text per RFC 5545 (commas, semicolons, backslashes, newlines).
function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
}

// ── Event building ───────────────────────────────────────────────────────────

function raceTitle(race: Race, year: string): string {
  return `🏁 F1: ${race.raceName} ${year}`
}

function raceLocation(race: Race): string {
  const { circuitName, Location } = race.Circuit
  return `${circuitName}, ${Location.locality}, ${Location.country}`
}

function vevent(race: Race, year: string, stamp: string): string {
  const { date, allDay } = raceStart(race)
  const uid = `f1-${year}-r${race.round}@f1racesignature.site`
  const summary = esc(raceTitle(race, year))
  const location = esc(raceLocation(race))
  const description = esc(
    `Round ${race.round} of the ${year} FIA Formula 1 World Championship. Session times & local-timezone schedule: ${SITE_URL}/schedule`,
  )

  const lines = ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`]
  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(date)}`)
    lines.push(`DTEND;VALUE=DATE:${icsDate(addDays(date, 1))}`)
  } else {
    lines.push(`DTSTART:${icsStamp(date)}`)
    lines.push(`DTEND:${icsStamp(new Date(date.getTime() + 2 * 60 * 60 * 1000))}`)
  }
  lines.push(`SUMMARY:${summary}`, `LOCATION:${location}`, `DESCRIPTION:${description}`, `URL:${SITE_URL}/calendar`, 'END:VEVENT')
  return lines.join('\r\n')
}

function wrapCalendar(events: string[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//F1RaceSignature//F1 Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

/** A standalone .ics for a single race. */
export function buildRaceIcs(race: Race, year: string): string {
  return wrapCalendar([vevent(race, year, icsStamp(new Date()))])
}

/** A standalone .ics for the whole season. */
export function buildSeasonIcs(races: Race[], year: string): string {
  const stamp = icsStamp(new Date())
  return wrapCalendar(races.map((r) => vevent(r, year, stamp)))
}

/** Turn .ics text into a downloadable data URI (works without client JS). */
export function icsDataUri(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
}

/** Google Calendar "add event" template link for one race. */
export function googleCalUrl(race: Race, year: string): string {
  const { date, allDay } = raceStart(race)
  const dates = allDay
    ? `${icsDate(date)}/${icsDate(addDays(date, 1))}`
    : `${icsStamp(date)}/${icsStamp(new Date(date.getTime() + 2 * 60 * 60 * 1000))}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: raceTitle(race, year),
    dates,
    location: raceLocation(race),
    details: `Round ${race.round} of the ${year} Formula 1 season. Local session times: ${SITE_URL}/schedule`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
