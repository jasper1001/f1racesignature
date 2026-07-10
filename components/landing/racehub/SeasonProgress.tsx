import type { Race } from '@/lib/f1api'
import { isPast } from '@/lib/f1api'
import { FlagIcon } from '@/components/ui/FlagIcon'
import { SEASON } from '@/lib/site'

/** The "41% · 9 of 22 rounds" progress bar with a flag strip of the calendar. */
export function SeasonProgress({ races }: { races: Race[] }) {
  if (races.length === 0) return null

  const total = races.length
  const done = races.filter((r) => isPast(r.date)).length
  const pct = Math.round((done / total) * 100)
  const toGo = total - done

  return (
    <section className="border-b border-[#0f0f0f] bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          {/* Percentage + label */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-[#e8002d] text-5xl font-display font-bold leading-none tabular-nums">{pct}%</span>
            <div>
              <p className="text-white font-semibold text-sm">{SEASON} Season</p>
              <p className="text-white/50 text-xs font-mono mt-0.5">
                {done} of {total} rounds complete · {toGo} to go
              </p>
            </div>
          </div>

          {/* Flag strip */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {races.map((r) => {
                const past = isPast(r.date)
                return (
                  <FlagIcon
                    key={r.round}
                    country={r.Circuit.Location.country}
                    className={`h-3.5 w-[22px] transition-opacity ${past ? 'opacity-100' : 'opacity-30 grayscale'}`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Progress track */}
        <div className="mt-4 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#e8002d] to-[#d4a017]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </section>
  )
}
