import { getSeasonPodiums, teamColor } from '@/lib/f1api'
import { SEASON } from '@/lib/site'
import { FlagIcon } from '@/components/ui/FlagIcon'
import { SectionHeader } from '@/components/landing/SectionHeader'

/** "Form Guide" — the most recent race winners as a horizontal strip. */
export async function FormGuide() {
  const podiums = await getSeasonPodiums(SEASON)
  const recent = podiums.filter((p) => p.podium.length > 0).slice(0, 6)
  if (recent.length === 0) return null

  return (
    <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          kicker="Recent Winners"
          title="Form Guide"
          link={{ href: '/results', label: 'All results' }}
          className="mb-8"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {recent.map((r) => {
            const winner = r.podium[0]
            const color = teamColor(winner.Constructor.constructorId)
            const code = winner.Driver.code ?? winner.Driver.familyName.slice(0, 3).toUpperCase()
            return (
              <div
                key={r.round}
                className="relative rounded-xl border border-[#1a1a1a] bg-[#080808] p-3.5 overflow-hidden"
              >
                <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-white/30 text-[10px] font-mono">R{r.round.padStart(2, '0')}</span>
                  <FlagIcon country={r.country} className="h-3.5 w-[22px]" />
                </div>
                <p className="text-white/50 text-[10px] font-mono uppercase tracking-wider mb-0.5">Winner</p>
                <p className="text-white font-semibold text-sm leading-tight">
                  {winner.Driver.givenName} {winner.Driver.familyName}
                </p>
                <p className="text-white/45 text-[11px] font-mono mt-1 truncate">
                  {code} · {winner.Constructor.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
