import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getSeason, getSchedule, formatRaceDate } from '@/lib/f1api'
import type { Race } from '@/lib/f1api'
import { googleCalUrl, buildSeasonIcs, icsDataUri } from '@/lib/calendar'
import { FaqSection } from '@/components/seo/FaqSection'
import { SITE_URL, raceSportsEvent, faqPageJsonLd, calendarFaqs } from '@/lib/seo'

export const revalidate = 3600

const FLAGS: Record<string, string> = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦', 'United States': '🇺🇸', Monaco: '🇲🇨',
  Canada: '🇨🇦', Spain: '🇪🇸', Austria: '🇦🇹', UK: '🇬🇧',
  'Great Britain': '🇬🇧', Hungary: '🇭🇺', Belgium: '🇧🇪',
  Netherlands: '🇳🇱', Azerbaijan: '🇦🇿', Singapore: '🇸🇬',
  Italy: '🇮🇹', Mexico: '🇲🇽', Brazil: '🇧🇷',
  'United Arab Emirates': '🇦🇪', Qatar: '🇶🇦', France: '🇫🇷',
  Thailand: '🇹🇭', Portugal: '🇵🇹',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export async function generateMetadata(): Promise<Metadata> {
  const season = await getSeason()
  const title = `F1 ${season} Calendar — Every Grand Prix Date`
  const description = `The complete ${season} Formula 1 calendar at a glance — every Grand Prix on a month-by-month grid, with one-click "Add to Google Calendar" for any race plus a full-season .ics download for Apple Calendar and Outlook.`
  return {
    title,
    description,
    keywords: [
      `F1 ${season} calendar`, `Formula 1 calendar ${season}`, 'F1 calendar', 'F1 race dates',
      `F1 ${season} race dates`, 'add F1 to Google Calendar', 'F1 ics download',
      'Formula 1 schedule calendar', 'F1 Grand Prix dates', `F1 ${season} season calendar`,
    ],
    alternates: { canonical: '/calendar' },
    openGraph: {
      title,
      description,
      url: '/calendar',
      type: 'website',
      siteName: 'F1RaceSignature',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `F1 ${season} Calendar — F1RaceSignature` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  }
}

// Months (year, monthIndex) spanned by the season, first race → last race.
function seasonMonths(races: Race[]): { year: number; month: number }[] {
  if (races.length === 0) return []
  const dates = races.map((r) => new Date(`${r.date}T00:00:00Z`)).sort((a, b) => a.getTime() - b.getTime())
  const start = dates[0]
  const end = dates[dates.length - 1]
  const months: { year: number; month: number }[] = []
  let y = start.getUTCFullYear()
  let m = start.getUTCMonth()
  while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
    months.push({ year: y, month: m })
    m++
    if (m > 11) { m = 0; y++ }
  }
  return months
}

export default async function CalendarPage() {
  const [season, races] = await Promise.all([getSeason(), getSchedule()])

  const byDate = new Map<string, Race>()
  for (const r of races) byDate.set(r.date, r)

  const months = seasonMonths(races)
  const now = Date.now()
  const faqs = calendarFaqs(races, season)
  const seasonIcs = races.length > 0 ? icsDataUri(buildSeasonIcs(races, season)) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `F1 ${season} Calendar`,
        description: `Month-by-month ${season} Formula 1 calendar with calendar export.`,
        url: `${SITE_URL}/calendar`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Calendar', item: `${SITE_URL}/calendar` },
          ],
        },
      },
      faqPageJsonLd(faqs),
      ...races.map((race) => raceSportsEvent(race, season, '/calendar')),
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Hero */}
        <div className="relative border-b border-[#0f0f0f] py-14 px-6 text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 70%)' }}
          />
          <p className="relative text-[10px] font-mono uppercase tracking-widest mb-4 text-[#d4a017]">
            Formula 1 · {season} Season
          </p>
          <h1 className="relative text-4xl md:text-5xl text-white mb-3 font-display">
            F1 {season} Calendar
          </h1>
          <p className="relative text-white/65 text-sm max-w-2xl mx-auto">
            Every {season} Grand Prix at a glance, month by month. Add the whole season — or any single race —
            straight to Google Calendar, Apple Calendar, or Outlook.
          </p>

          {races.length > 0 && (
            <div className="relative mt-7 flex flex-col items-center gap-3">
              <p className="text-white/65 text-xs font-mono">Tap any race to add it to Google Calendar</p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {seasonIcs && (
                  <a
                    href={seasonIcs}
                    download={`f1-${season}-calendar.ics`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d4a017] text-black text-sm font-semibold rounded-xl hover:bg-[#e0ac1f] transition-colors"
                  >
                    ↓ Download full season (.ics)
                  </a>
                )}
                <Link
                  href="/schedule"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white text-sm font-medium rounded-xl border border-white/10 hover:bg-white/8 transition-colors"
                >
                  Need session times? View the schedule
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-10 space-y-10">
          {races.length === 0 ? (
            <p className="text-center text-white/65 text-sm font-mono py-20">Calendar not yet available.</p>
          ) : (
            <>
              {/* Month grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {months.map(({ year, month }) => (
                  <MonthGrid
                    key={`${year}-${month}`}
                    year={year}
                    month={month}
                    byDate={byDate}
                    season={season}
                    now={now}
                  />
                ))}
              </div>

              {/* Add to Google Calendar — per race */}
              <section className="border-t border-[#0f0f0f] pt-10">
                <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-2">Add to Google Calendar</p>
                <h2 className="text-2xl md:text-3xl text-white mb-1 font-display">
                  One-click reminders
                </h2>
                <p className="text-white/65 text-sm mb-6">
                  Add any race straight to your Google Calendar — it opens in a new tab, with nothing to download.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {races.map((race) => (
                    <a
                      key={race.round}
                      href={googleCalUrl(race, season)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-[#161616] bg-[#0a0a0a] px-3.5 py-3 hover:border-[#d4a017]/40 hover:bg-[#0d0d0d] transition-colors"
                    >
                      <span className="text-lg leading-none shrink-0">{FLAGS[race.Circuit.Location.country] ?? '🏁'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-sm font-medium truncate">
                          {race.raceName.replace('Grand Prix', 'GP')}
                        </div>
                        <div className="text-white/65 text-[10px] font-mono">{formatRaceDate(race.date)}</div>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-[#2a2a2a] text-white/75 group-hover:text-black group-hover:bg-[#d4a017] group-hover:border-[#d4a017] transition-colors">
                        + Google
                      </span>
                    </a>
                  ))}
                </div>
              </section>

              {/* FAQ */}
              <FaqSection items={faqs} title={`F1 ${season} calendar — your questions`} />

              <p className="text-center text-white/65 text-xs pt-2">
                Live data via the Jolpica F1 API (Ergast successor). Updates hourly.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function MonthGrid({
  year, month, byDate, season, now,
}: {
  year: number; month: number; byDate: Map<string, Race>; season: string; now: number
}) {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7 // Monday-first
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="rounded-2xl border border-[#161616] bg-[#070707] p-4">
      <p className="text-white font-semibold mb-3" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
        {MONTH_NAMES[month]} <span className="text-white/65 font-mono text-sm font-normal">{year}</span>
      </p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-white/65 text-[9px] font-mono uppercase tracking-wider pb-1">{w}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`b${i}`} />
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
          const race = byDate.get(dateStr)

          if (!race) {
            return (
              <span key={dateStr} className="aspect-square flex items-center justify-center text-white/65 text-xs font-mono">
                {day}
              </span>
            )
          }

          const flag = FLAGS[race.Circuit.Location.country] ?? '🏁'
          const past = new Date(`${race.date}T23:59:59Z`).getTime() < now
          const shortName = race.raceName.replace(' Grand Prix', '').replace('Grand Prix', 'GP')

          return (
            <a
              key={dateStr}
              href={googleCalUrl(race, season)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Add ${race.raceName} to Google Calendar`}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg border p-0.5 transition-colors ${
                past
                  ? 'border-[#2a2a2a] bg-[#121212] opacity-85 hover:opacity-100'
                  : 'border-[#d4a017]/50 bg-[#d4a017]/12 hover:bg-[#d4a017]/25'
              }`}
            >
              <span className="text-[9px] font-mono text-white/75 leading-none">{day}</span>
              <span className="text-sm leading-none mt-0.5">{flag}</span>
              <span className="hidden sm:block text-[7px] leading-tight text-white/90 truncate w-full text-center mt-0.5">
                {shortName}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
