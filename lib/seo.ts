import type { Race } from '@/lib/f1api'
import { formatRaceDate } from '@/lib/f1api'

export { SITE_URL } from '@/lib/site'
import { SITE_URL } from '@/lib/site'

// Race weekend "end" — race time + ~2h, or the race date for all-day entries.
function eventEnd(race: Race): string {
  if (race.time) {
    const start = new Date(`${race.date}T${race.time}`)
    if (!Number.isNaN(start.getTime())) {
      return new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString()
    }
  }
  return race.date
}

/**
 * Enriched schema.org SportsEvent for one Grand Prix. Includes the fields
 * Google recommends for Event rich results (eventStatus, eventAttendanceMode,
 * endDate, description, image, organizer, performer) so each race is eligible.
 */
export function raceSportsEvent(race: Race, season: string, path: string) {
  return {
    '@type': 'SportsEvent',
    name: `${race.raceName} ${season}`,
    description: `Round ${race.round} of the ${season} FIA Formula 1 World Championship, held at ${race.Circuit.circuitName} in ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}.`,
    startDate: race.time ? `${race.date}T${race.time}` : race.date,
    endDate: eventEnd(race),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    sport: 'Formula 1',
    image: [`${SITE_URL}/opengraph-image`],
    location: {
      '@type': 'Place',
      name: race.Circuit.circuitName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: race.Circuit.Location.locality,
        addressCountry: race.Circuit.Location.country,
      },
    },
    organizer: { '@type': 'Organization', name: 'Formula 1', url: 'https://www.formula1.com' },
    performer: { '@type': 'PerformingGroup', name: `Formula 1 ${season} grid` },
    url: `${SITE_URL}${path}`,
  }
}

export interface FaqItem {
  q: string
  a: string
}

/** schema.org FAQPage from a list of Q&A pairs (visible content should mirror these). */
export function faqPageJsonLd(items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }
}

// ── Season-aware FAQ copy ──────────────────────────────────────────────────────

function firstRace(races: Race[]): Race | undefined {
  return [...races].sort((a, b) => Number(a.round) - Number(b.round))[0]
}

export function scheduleFaqs(races: Race[], season: string): FaqItem[] {
  const first = firstRace(races)
  const opener = first
    ? `The ${season} F1 season opens with the ${first.raceName} at ${first.Circuit.circuitName} on ${formatRaceDate(first.date)}.`
    : `The ${season} F1 season calendar is being finalised.`
  return [
    {
      q: `When does the ${season} Formula 1 season start?`,
      a: opener,
    },
    {
      q: `How many races are in the ${season} F1 season?`,
      a: `There are ${races.length} Grand Prix on the ${season} Formula 1 calendar.`,
    },
    {
      q: 'What time do F1 sessions start in my timezone?',
      a: 'Every Practice, Qualifying, Sprint and Race time on this page is converted to your device’s local timezone automatically. Pick your timezone at the top of the schedule and all session times update instantly — no manual UTC conversion.',
    },
    {
      q: `Does the ${season} F1 calendar include Sprint races?`,
      a: 'Yes. On Sprint weekends the schedule shows the Sprint Qualifying and Sprint session times alongside the usual Practice, Qualifying and Race sessions.',
    },
    {
      q: 'Where does the F1 schedule data come from?',
      a: 'Live timing data from the Jolpica F1 API (the maintained successor to Ergast), refreshed hourly.',
    },
  ]
}

export function calendarFaqs(races: Race[], season: string): FaqItem[] {
  const first = firstRace(races)
  return [
    {
      q: `How do I add the ${season} F1 calendar to Google Calendar?`,
      a: 'Tap any race on the calendar grid — or in the list below it — and it opens a pre-filled Google Calendar event in a new tab. Just hit save; there is nothing to download.',
    },
    {
      q: `Can I download the ${season} F1 schedule as an .ics file?`,
      a: `Yes. Use the “Download full season (.ics)” button to import every ${season} Grand Prix into Apple Calendar, Outlook, or any calendar app in one go.`,
    },
    {
      q: `When is the first race of the ${season} F1 season?`,
      a: first
        ? `The season opens with the ${first.raceName} on ${formatRaceDate(first.date)}.`
        : `The ${season} calendar is being finalised.`,
    },
    {
      q: `How many Grand Prix are on the ${season} F1 calendar?`,
      a: `The ${season} Formula 1 calendar has ${races.length} Grand Prix.`,
    },
    {
      q: 'Does the calendar show race start times in my timezone?',
      a: 'The grid shows each race date. For full Practice, Qualifying, Sprint and Race session times converted to your local timezone, open the schedule page.',
    },
  ]
}
