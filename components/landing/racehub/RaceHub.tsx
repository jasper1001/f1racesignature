import { getSchedule } from '@/lib/f1api'
import { getAllRaces } from '@/lib/serverData'
import { circuitFacts, circuitTz } from '@/lib/circuitFacts'
import { NextRaceHero } from './NextRaceHero'
import { SeasonProgress } from './SeasonProgress'

// Jolpica/Ergast circuitId → our internal circuit id, for linking the "create a
// poster" CTA to a matching historic drive in the Studio.
const CIRCUIT_MAP: Record<string, string> = {
  monaco: 'monaco', monza: 'monza', spa: 'spa', silverstone: 'silverstone',
  bahrain: 'bahrain', yas_marina: 'abu_dhabi', suzuka: 'suzuka',
  interlagos: 'interlagos', hungaroring: 'hungaroring', miami: 'miami',
  marina_bay: 'marina_bay',
}

const HOUR = 3_600_000
const RACE_BUFFER = 4 * HOUR // treat a race as "current" until ~4h after start

/** The race hub: the NEXT RACE hero card + the season progress strip. */
export async function RaceHub() {
  const schedule = await getSchedule()
  if (schedule.length === 0) return null

  const now = Date.now()
  const withTs = schedule.map((r) => ({
    race: r,
    ts: new Date(`${r.date}T${r.time ?? '14:00:00Z'}`).getTime(),
  }))

  // Next race = earliest whose race hasn't finished; else the final round.
  const next = withTs.filter(({ ts }) => ts + RACE_BUFFER >= now).sort((a, b) => a.ts - b.ts)[0]
    ?? withTs[withTs.length - 1]
  const race = next.race

  // Optional Studio poster CTA when we have a historic drive at this circuit.
  const internalId = CIRCUIT_MAP[race.Circuit.circuitId]
  const historic = internalId ? getAllRaces().find((r) => r.circuit === internalId) : undefined
  const posterHref = historic ? `/studio?driver=${historic.driverId}&race=${historic.id}` : undefined
  const posterLabel = historic ? `Create a ${race.Circuit.Location.locality} poster` : undefined

  return (
    <>
      <NextRaceHero
        race={race}
        round={Number(race.round)}
        totalRounds={schedule.length}
        facts={circuitFacts(race.Circuit.circuitId)}
        trackTz={circuitTz(race.Circuit.circuitId)}
        posterHref={posterHref}
        posterLabel={posterLabel}
      />
      <SeasonProgress races={schedule} />
    </>
  )
}
