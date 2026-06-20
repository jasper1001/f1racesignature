import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  getSeason,
  getDriverStandings,
  getConstructorStandings,
  getLastRaceResults,
  getPastSeason,
  getSeasonPodiums,
  teamColor,
  formatRaceDate,
} from '@/lib/f1api'
import type { DriverStanding, ConstructorStanding, RacePodium } from '@/lib/f1api'
import { findStudioLapsForWinners } from '@/lib/serverData'

export const revalidate = 3600

type StudioLink = { driverId: string; raceId: string }

export async function generateMetadata(): Promise<Metadata> {
  const { round, standings } = await getDriverStandings()
  const leader = standings[0]
  const roundSuffix = round && round !== '0' ? ` — After Round ${round}` : ''
  const title = `F1 2026 Standings & Results${roundSuffix}`
  const description = leader
    ? `Live 2026 Formula 1 standings: ${leader.Driver.givenName} ${leader.Driver.familyName} leads on ${leader.points} points after round ${round}. Full driver and constructor standings, latest results, and the race calendar — real F1 data, updated automatically.`
    : 'Live 2026 Formula 1 results, driver and constructor standings, and the full race calendar — real data, updated automatically.'
  return {
    title,
    description,
    keywords: [
      'F1 2026 standings', 'Formula 1 2026 results', 'F1 driver standings 2026',
      'F1 constructor standings 2026', 'Formula 1 championship 2026', 'F1 race results',
      'F1 points table 2026', 'Formula 1 season 2026', 'F1 live standings',
    ],
    alternates: { canonical: '/results' },
    openGraph: {
      title,
      description,
      url: '/results',
      type: 'website',
      siteName: 'F1RaceSignature',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 2026 Season Standings — F1RaceSignature' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  }
}

export default async function ResultsPage() {
  const season = await getSeason()
  const pastYears = Array.from({ length: 13 }, (_, i) => String(Number(season) - 1 - i))

  const [driverData, constructors, lastRace, podiums, ...pastSeasons] = await Promise.all([
    getDriverStandings(),
    getConstructorStandings(),
    getLastRaceResults(),
    getSeasonPodiums(season),
    ...pastYears.map((y) => getPastSeason(y)),
  ])

  const { round, standings: drivers } = driverData

  // Match each current-season winner to a curated Studio lap — but only where we
  // actually have real telemetry for that driver + circuit + year.
  const studioLinks = findStudioLapsForWinners(
    podiums
      .filter((p) => p.podium[0])
      .map((p) => ({ round: p.round, familyName: p.podium[0].Driver.familyName, circuitName: p.circuitName })),
    Number(season),
  )

  const standingsJsonLd = drivers.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `F1 ${season} Driver Standings`,
        numberOfItems: drivers.length,
        itemListElement: drivers.slice(0, 20).map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${d.Driver.givenName} ${d.Driver.familyName} — ${d.points} pts`,
        })),
      }
    : null

  return (
    <>
      {standingsJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(standingsJsonLd) }} />
      )}
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Hero */}
        <div className="relative py-16 md:py-20 border-b border-[#0f0f0f] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,160,23,0.05) 0%, transparent 70%)',
            }}
          />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-4">
              Live · Real F1 Data
            </p>
            <h1
              className="text-4xl md:text-6xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              {season} Season
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
              Driver and constructor standings, race results, and the full calendar —
              {round !== '0' ? ` after round ${round}.` : ' updated automatically.'}
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
          {drivers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/55 text-sm">
                Live standings are temporarily unavailable. Please check back shortly.
              </p>
            </div>
          ) : (
            <>
              {/* Latest race podium */}
              {lastRace?.Results && lastRace.Results.length >= 3 && (
                <section>
                  <SectionHeading
                    eyebrow="Most Recent Race"
                    title={lastRace.raceName}
                    sub={`${lastRace.Circuit.circuitName} · ${formatRaceDate(lastRace.date)}`}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    {lastRace.Results.slice(0, 3).map((r, i) => {
                      const color = teamColor(r.Constructor.constructorId)
                      const medal = ['1st', '2nd', '3rd'][i]
                      return (
                        <div
                          key={r.Driver.driverId}
                          className="rounded-xl p-4 border border-[#1a1a1a] bg-[#0a0a0a]"
                          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[#d4a017] text-xs font-mono font-semibold">{medal}</span>
                            <span className="text-white/45 text-[10px] font-mono uppercase">
                              {r.Constructor.name}
                            </span>
                          </div>
                          <div className="text-white font-semibold">
                            {r.Driver.givenName} {r.Driver.familyName}
                          </div>
                          <div className="text-white/50 text-xs mt-1 font-mono">
                            {r.Time?.time ?? r.status} · +{r.points} pts
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Driver standings */}
              <section>
                <SectionHeading eyebrow="Championship" title="Driver Standings" />
                <div className="mt-6">
                  <DriverStandingsTable drivers={drivers} />
                </div>
              </section>

              {/* Constructor standings */}
              {constructors.length > 0 && (
                <section>
                  <SectionHeading eyebrow="Championship" title="Constructor Standings" />
                  <div className="mt-6">
                    <ConstructorStandingsGrid constructors={constructors} />
                  </div>
                </section>
              )}

              {/* Race results (current season) */}
              {podiums.length > 0 && (
                <section>
                  <SectionHeading
                    eyebrow="Race by Race"
                    title={`${season} Race Results`}
                    sub={`${podiums.length} ${podiums.length === 1 ? 'round' : 'rounds'} completed — winner and podium for each.`}
                  />
                  <div className="mt-6">
                    <RaceResultsList podiums={podiums} studioLinks={studioLinks} />
                  </div>
                </section>
              )}

              {/* Calendar CTA — full schedule lives on its own page */}
              <section>
                <a
                  href="/schedule"
                  className="group block rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 md:p-8 hover:border-[#d4a017]/40 transition-colors relative overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />
                  <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                      <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-2">Calendar</p>
                      <h2 className="text-2xl md:text-3xl text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                        {season} Race Schedule
                      </h2>
                      <p className="text-white/55 text-sm mt-2 max-w-md">
                        Every Grand Prix with Practice, Qualifying, Sprint and Race times — converted to your
                        local timezone, plus a live countdown to the next session.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 text-white font-medium rounded-xl border border-white/10 group-hover:bg-[#d4a017] group-hover:text-black group-hover:border-[#d4a017] transition-all whitespace-nowrap self-start">
                      View Full Schedule
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </a>
              </section>

              {/* Past seasons */}
              {pastSeasons.some((s) => s.drivers.length > 0) && (
                <section>
                  <SectionHeading eyebrow="The Archive" title="Past Seasons" sub="Final standings from previous championships." />
                  <div className="mt-6 space-y-3">
                    {pastSeasons.map((s) =>
                      s.drivers.length === 0 ? null : (
                        <PastSeasonPanel key={s.year} season={s} />
                      ),
                    )}
                  </div>
                </section>
              )}

              <p className="text-center text-white/35 text-xs pt-4">
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

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div>
      <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-2">{eyebrow}</p>
      <h2 className="text-2xl md:text-3xl text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        {title}
      </h2>
      {sub && <p className="text-white/55 text-sm mt-1">{sub}</p>}
    </div>
  )
}

function DriverStandingsTable({ drivers }: { drivers: DriverStanding[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#161616]">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/45 text-[11px] uppercase tracking-wider border-b border-[#161616]">
            <th className="py-3 px-4 font-medium">Pos</th>
            <th className="py-3 px-4 font-medium">Driver</th>
            <th className="py-3 px-4 font-medium hidden sm:table-cell">Team</th>
            <th className="py-3 px-4 font-medium text-center">Wins</th>
            <th className="py-3 px-4 font-medium text-right">Points</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => {
            const color = teamColor(d.Constructors[0]?.constructorId ?? '')
            return (
              <tr
                key={d.Driver.driverId}
                className="border-b border-[#0f0f0f] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 text-[#666666] font-mono">{d.position}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-white font-medium">
                      {d.Driver.givenName} {d.Driver.familyName}
                    </span>
                    {d.Driver.code && (
                      <span className="text-white/40 text-[10px] font-mono hidden md:inline">
                        {d.Driver.code}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#777777] hidden sm:table-cell">
                  {d.Constructors[0]?.name ?? '—'}
                </td>
                <td className="py-3 px-4 text-center text-[#777777] font-mono">{d.wins}</td>
                <td className="py-3 px-4 text-right text-white font-mono font-semibold">{d.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ConstructorStandingsGrid({ constructors }: { constructors: ConstructorStanding[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {constructors.map((c) => {
        const color = teamColor(c.Constructor.constructorId)
        return (
          <div
            key={c.Constructor.constructorId}
            className="flex items-center justify-between rounded-xl border border-[#161616] bg-[#0a0a0a] px-4 py-3"
            style={{ borderLeftColor: color, borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-white/55 font-mono text-sm w-5">{c.position}</span>
              <span className="text-white font-medium text-sm">{c.Constructor.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/50 text-xs font-mono hidden sm:inline">{c.wins} wins</span>
              <span className="text-white font-mono font-semibold text-sm">{c.points}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RaceResultsList({
  podiums,
  studioLinks,
}: {
  podiums: RacePodium[]
  studioLinks?: Record<string, StudioLink>
}) {
  const medalColor = ['#d4a017', '#b8b8b8', '#cd7f32'] // gold, silver, bronze
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {podiums.map((race) => {
        const studio = studioLinks?.[race.round]
        return (
          <div key={race.round} className="rounded-xl border border-[#161616] bg-[#0a0a0a] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
              <div className="min-w-0">
                <span className="text-white text-sm font-medium">
                  {race.raceName.replace('Grand Prix', 'GP')}
                </span>
                <span className="text-white/40 text-xs ml-2 font-mono">{race.country}</span>
              </div>
              <span className="text-white/35 text-[10px] font-mono uppercase tracking-wider shrink-0">
                Rnd {race.round} · {formatRaceDate(race.date)}
              </span>
            </div>
            <div className="divide-y divide-[#0d0d0d]">
              {race.podium.map((r, i) => {
                const color = teamColor(r.Constructor.constructorId)
                return (
                  <div key={r.Driver.driverId} className="flex items-center gap-3 px-4 py-2">
                    <span
                      className="text-[11px] font-mono font-semibold w-4 text-center shrink-0"
                      style={{ color: medalColor[i] ?? '#777777' }}
                    >
                      {r.position}
                    </span>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-white text-sm font-medium truncate">
                      {r.Driver.givenName} {r.Driver.familyName}
                    </span>
                    <span className="text-white/40 text-[10px] font-mono ml-auto shrink-0 hidden sm:inline">
                      {r.Constructor.name}
                    </span>
                  </div>
                )
              })}
            </div>
            {studio && (
              <a
                href={`/studio?driver=${studio.driverId}&race=${studio.raceId}`}
                className="group flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-[#141414] text-[#d4a017] text-[10px] font-mono uppercase tracking-wider hover:bg-[#d4a017]/10 transition-colors"
              >
                View winner&apos;s lap in Studio
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-0.5">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PastSeasonPanel({ season }: { season: { year: string; drivers: DriverStanding[]; constructors: ConstructorStanding[]; podiums: RacePodium[] } }) {
  const champ = season.drivers[0]
  const champColor = teamColor(champ?.Constructors[0]?.constructorId ?? '')
  const teamChamp = season.constructors[0]

  return (
    <details className="group rounded-xl border border-[#161616] bg-[#0a0a0a] overflow-hidden">
      <summary className="flex items-center justify-between gap-4 px-4 py-4 cursor-pointer list-none select-none hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-4 min-w-0">
          <span
            className="text-2xl md:text-3xl text-white shrink-0"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {season.year}
          </span>
          {champ && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full shrink-0" style={{ backgroundColor: champColor }} />
                <span className="text-white text-sm font-medium truncate">
                  {champ.Driver.givenName} {champ.Driver.familyName}
                </span>
                <span className="text-[#d4a017] text-[10px] font-mono uppercase tracking-wider shrink-0">Champion</span>
              </div>
              {teamChamp && (
                <p className="text-white/45 text-xs mt-1 truncate">
                  Constructors: {teamChamp.Constructor.name}
                </p>
              )}
            </div>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className="text-white/40 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="px-4 pb-4 pt-1 space-y-5 border-t border-[#141414]">
        <div className="pt-4">
          <p className="text-white/45 text-[11px] font-mono uppercase tracking-wider mb-3">Driver Standings</p>
          <DriverStandingsTable drivers={season.drivers} />
        </div>
        {season.constructors.length > 0 && (
          <div>
            <p className="text-white/45 text-[11px] font-mono uppercase tracking-wider mb-3">Constructor Standings</p>
            <ConstructorStandingsGrid constructors={season.constructors} />
          </div>
        )}
        {season.podiums.length > 0 && (
          <div>
            <p className="text-white/45 text-[11px] font-mono uppercase tracking-wider mb-3">Race Results</p>
            <RaceResultsList podiums={season.podiums} />
          </div>
        )}
      </div>
    </details>
  )
}
