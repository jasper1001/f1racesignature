import { Fragment } from 'react'
import type { TeamStint } from '@/lib/driverTeams'

/**
 * Horizontal career timeline showing a driver's team moves, each stint as a
 * colour-coded card connected by arrows. Wraps on small screens.
 */
export function TeamTransferDiagram({ stints }: { stints: TeamStint[] }) {
  if (stints.length === 0) return null
  const currentYear = new Date().getFullYear()

  return (
    <div className="flex flex-wrap items-center gap-y-3">
      {stints.map((s, i) => {
        const end = s.endYear ?? currentYear
        const seasons = Math.max(1, end - s.startYear + 1)
        const ongoing = s.endYear === null
        return (
          <Fragment key={`${s.team}-${s.startYear}`}>
            <div
              className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 min-w-[140px]"
              style={{ borderLeftColor: s.color, borderLeftWidth: 3 }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-white font-medium text-sm">{s.team}</span>
                {ongoing && (
                  <span className="text-[#d4a017] text-[9px] font-mono uppercase tracking-wider">Current</span>
                )}
              </div>
              <div className="text-white/65 text-xs font-mono mt-1.5">
                {s.startYear}–{ongoing ? 'present' : s.endYear}
              </div>
              <div className="text-white/65 text-[10px] mt-0.5">
                {seasons} season{seasons === 1 ? '' : 's'}
              </div>
            </div>

            {i < stints.length - 1 && (
              <svg
                className="text-white/25 mx-2 shrink-0"
                width="18" height="14" viewBox="0 0 18 14" fill="none"
                aria-hidden="true"
              >
                <path d="M2 7h13M11 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
