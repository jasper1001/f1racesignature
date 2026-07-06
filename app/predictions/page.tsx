import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  getSeason,
  getSchedule,
  getGridDrivers,
  getSeasonPoles,
  getSeasonPodiums,
  teamColor,
  type Race,
} from '@/lib/f1api'
import type { RoundActual } from '@/lib/predictions'
import { PredictionsClient, type DriverOption, type NextRound } from '@/components/predictions/PredictionsClient'

export const revalidate = 3600

// A round's picks lock when the weekend's first qualifying session starts —
// Sprint Qualifying on sprint weekends, Qualifying otherwise. Mirrors the
// server-side lock times seeded in supabase/migrations/011_predictions.sql.
function lockTime(race: Race): string | null {
  const session = race.SprintQualifying ?? race.Qualifying
  if (!session) return null
  return `${session.date}T${session.time ?? '00:00:00Z'}`
}

function raceTime(race: Race): number {
  return new Date(`${race.date}T${race.time ?? '12:00:00Z'}`).getTime()
}

export async function generateMetadata(): Promise<Metadata> {
  const season = await getSeason()
  const title = `F1 ${season} Race Predictions League`
  const description = `Predict pole position and the podium before every ${season} Grand Prix, score points against the real results, and climb the season-long league table. Free to play — no signup needed.`
  return {
    title,
    description,
    keywords: [
      'F1 predictions', 'F1 prediction game', `F1 ${season} predictions`,
      'predict F1 podium', 'F1 fantasy league', 'Formula 1 prediction league',
      'F1 pole prediction', 'free F1 game',
    ],
    alternates: { canonical: '/predictions' },
    openGraph: {
      title,
      description,
      url: '/predictions',
      type: 'website',
      siteName: 'F1RaceSignature',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `F1 ${season} Race Predictions League — F1RaceSignature` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
  }
}

export default async function PredictionsPage() {
  const season = await getSeason()
  const [schedule, grid, poles, podiums] = await Promise.all([
    getSchedule(),
    getGridDrivers(),
    getSeasonPoles(season),
    getSeasonPodiums(season),
  ])

  // The round currently open (or in progress): the first race that hasn't
  // finished yet, with a ~4h buffer so a live race doesn't flip to the next round.
  const nowMs = Date.now()
  const current = schedule.find((r) => raceTime(r) + 4 * 3600_000 > nowMs)
  const lock = current ? lockTime(current) : null
  const next: NextRound | null =
    current && lock
      ? {
          round: Number(current.round),
          raceName: current.raceName,
          circuitName: current.Circuit.circuitName,
          country: current.Circuit.Location.country,
          lockIso: lock,
          hasSprint: Boolean(current.SprintQualifying),
        }
      : null

  // Real outcomes per round (pole + podium driverIds) for client-side scoring.
  const actualsByRound = new Map<number, RoundActual>()
  const driverNames: Record<string, string> = {}
  for (const d of grid) driverNames[d.driverId] = d.name

  for (const pole of poles) {
    actualsByRound.set(Number(pole.round), {
      round: Number(pole.round),
      raceName: pole.raceName,
      pole: pole.driver.driverId,
    })
    driverNames[pole.driver.driverId] = `${pole.driver.givenName} ${pole.driver.familyName}`
  }
  for (const race of podiums) {
    if (race.podium.length < 3) continue
    const entry = actualsByRound.get(Number(race.round)) ?? {
      round: Number(race.round),
      raceName: race.raceName,
    }
    entry.raceName = race.raceName
    entry.podium = [
      race.podium[0].Driver.driverId,
      race.podium[1].Driver.driverId,
      race.podium[2].Driver.driverId,
    ]
    for (const r of race.podium) {
      driverNames[r.Driver.driverId] = `${r.Driver.givenName} ${r.Driver.familyName}`
    }
    actualsByRound.set(Number(race.round), entry)
  }
  const actuals = [...actualsByRound.values()].sort((a, b) => a.round - b.round)

  const drivers: DriverOption[] = grid.map((d) => ({
    id: d.driverId,
    name: d.name,
    team: d.teamName,
    color: teamColor(d.constructorId),
  }))

  return (
    <>
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
              Free · Every Race Weekend
            </p>
            <h1 className="text-4xl md:text-6xl text-white mb-4 font-display">
              Race Predictions
            </h1>
            <p className="text-white/65 text-base md:text-lg max-w-xl mx-auto">
              Call pole and the podium before qualifying, score points against the real
              results, and climb the {season} league table.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <PredictionsClient
            season={season}
            next={next}
            drivers={drivers}
            actuals={actuals}
            driverNames={driverNames}
          />
          <p className="text-center text-white/65 text-xs pt-16">
            Results via the Jolpica F1 API (Ergast successor). Scores update automatically after each session.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
