import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  getSeason,
  getDriverStandings,
  getConstructorStandings,
  getSchedule,
  getLastRaceResults,
  teamColor,
  formatRaceDate,
  isPast,
} from '@/lib/f1api'

export const revalidate = 3600

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
  const [season, driverData, constructors, schedule, lastRace] = await Promise.all([
    getSeason(),
    getDriverStandings(),
    getConstructorStandings(),
    getSchedule(),
    getLastRaceResults(),
  ])

  const { round, standings: drivers } = driverData

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
                <div className="mt-6 overflow-x-auto rounded-xl border border-[#161616]">
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
                            <td className="py-3 px-4 text-right text-white font-mono font-semibold">
                              {d.points}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Constructor standings */}
              {constructors.length > 0 && (
                <section>
                  <SectionHeading eyebrow="Championship" title="Constructor Standings" />
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            <span className="text-white/50 text-xs font-mono hidden sm:inline">
                              {c.wins} wins
                            </span>
                            <span className="text-white font-mono font-semibold text-sm">{c.points}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Calendar */}
              {schedule.length > 0 && (
                <section>
                  <SectionHeading eyebrow="Calendar" title={`${season} Race Schedule`} />
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {schedule.map((race) => {
                      const done = isPast(race.date)
                      return (
                        <div
                          key={race.round}
                          className={`rounded-xl border px-4 py-3 ${
                            done
                              ? 'border-[#1a1a1a] bg-[#0a0a0a]'
                              : 'border-[#141414] bg-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider">
                              Round {race.round}
                            </span>
                            {done ? (
                              <span className="text-[#38b000] text-[10px] font-mono">✓ Done</span>
                            ) : (
                              <span className="text-[#d4a017] text-[10px] font-mono">Upcoming</span>
                            )}
                          </div>
                          <div className={`text-sm font-medium ${done ? 'text-white' : 'text-[#888888]'}`}>
                            {race.raceName.replace('Grand Prix', 'GP')}
                          </div>
                          <div className="text-white/50 text-xs mt-0.5">
                            {race.Circuit.Location.country} · {formatRaceDate(race.date)}
                          </div>
                        </div>
                      )
                    })}
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
