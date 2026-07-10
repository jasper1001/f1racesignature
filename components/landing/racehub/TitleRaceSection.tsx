import { getDriverStandings, getSeasonDriverBreakdowns, teamColor } from '@/lib/f1api'
import { SEASON } from '@/lib/site'
import { SectionHeader } from '@/components/landing/SectionHeader'
import { TitleRaceChart, type TitleSeries } from './TitleRaceChart'

const LINES = 5 // top-N championship contenders to plot

/** "The Title Race" — cumulative championship points by round for the top drivers. */
export async function TitleRaceSection() {
  const [{ standings }, breakdowns] = await Promise.all([
    getDriverStandings(),
    getSeasonDriverBreakdowns(SEASON),
  ])

  if (standings.length === 0 || Object.keys(breakdowns).length === 0) return null

  // Number of completed rounds = highest round seen in any driver's breakdown.
  let rounds = 0
  for (const entries of Object.values(breakdowns)) {
    for (const e of entries) rounds = Math.max(rounds, Number(e.round))
  }
  if (rounds < 2) return null // need at least two points to draw a line

  const series: TitleSeries[] = standings.slice(0, LINES).map((s) => {
    const id = s.Driver.driverId
    const byRound = new Map(breakdowns[id]?.map((e) => [Number(e.round), e.points]) ?? [])
    const cum: number[] = []
    let running = 0
    for (let r = 1; r <= rounds; r++) {
      running += byRound.get(r) ?? 0
      cum.push(running)
    }
    const team = s.Constructors[s.Constructors.length - 1]
    return {
      code: s.Driver.code ?? s.Driver.familyName.slice(0, 3).toUpperCase(),
      color: teamColor(team?.constructorId ?? ''),
      total: Number(s.points),
      cum,
    }
  })

  return (
    <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          kicker={`${SEASON} Championship`}
          title="The Title Race"
          link={{ href: '/results', label: 'Full standings' }}
          className="mb-8"
        />
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#070707] p-5 md:p-7">
          <TitleRaceChart series={series} rounds={rounds} />
        </div>
      </div>
    </section>
  )
}
