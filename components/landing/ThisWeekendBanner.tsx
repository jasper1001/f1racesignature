import Link from 'next/link'
import { getSchedule } from '@/lib/f1api'
import { getAllRaces } from '@/lib/serverData'

// Map Ergast/Jolpica circuitId → our internal circuit id
const CIRCUIT_MAP: Record<string, string> = {
  monaco: 'monaco',
  monza: 'monza',
  spa: 'spa',
  silverstone: 'silverstone',
  bahrain: 'bahrain',
  yas_marina: 'abu_dhabi',
  suzuka: 'suzuka',
  interlagos: 'interlagos',
  hungaroring: 'hungaroring',
  miami: 'miami',
  marina_bay: 'marina_bay',
}

const DAY = 86_400_000

export async function ThisWeekendBanner() {
  const schedule = await getSchedule()
  if (schedule.length === 0) return null

  const now = Date.now()
  // Find the next race that hasn't finished yet (race day + 1)
  const upcoming = schedule
    .map((r) => ({ race: r, t: new Date(r.date + 'T14:00:00Z').getTime() }))
    .filter(({ t }) => t + DAY >= now)
    .sort((a, b) => a.t - b.t)[0]

  if (!upcoming) return null

  // Only show during race week (within 7 days before, through race day)
  const daysAway = Math.ceil((upcoming.t - now) / DAY)
  if (daysAway > 7) return null

  const race = upcoming.race
  const ourCircuit = CIRCUIT_MAP[race.Circuit.circuitId]
  const historic = ourCircuit ? getAllRaces().find((r) => r.circuit === ourCircuit) : undefined

  const when = daysAway <= 0 ? 'Live this weekend' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`

  return (
    <div className="relative z-30 border-b border-[#d4a017]/20 bg-gradient-to-r from-[#0a0a0a] via-[#12100a] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1.5 text-center">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38b000] animate-pulse" />
          <span className="text-[#38b000] uppercase tracking-widest">{when}</span>
        </span>
        <span className="text-white text-sm font-medium">{race.raceName}</span>
        <span className="text-[#555555] text-xs hidden sm:inline">· {race.Circuit.Location.country}</span>
        <span className="flex items-center gap-3 sm:ml-2">
          <Link href="/results" className="text-[#d4a017] text-xs font-medium hover:underline">
            Live standings →
          </Link>
          {historic && (
            <Link
              href={`/studio?driver=${historic.driverId}&race=${historic.id}`}
              className="text-xs font-medium px-3 py-1 rounded-full bg-[#d4a017] text-black hover:bg-[#e8b84b] transition-colors"
            >
              Create a {race.Circuit.Location.locality} poster
            </Link>
          )}
        </span>
      </div>
    </div>
  )
}
