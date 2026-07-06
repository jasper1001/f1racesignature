'use client'

import { useState } from 'react'
import { teamColor } from '@/lib/f1api'
import type { DriverStanding, DriverRaceEntry } from '@/lib/f1api'

export function DriverStandingsTable({
  drivers,
  breakdowns,
}: {
  drivers: DriverStanding[]
  breakdowns?: Record<string, DriverRaceEntry[]>
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto rounded-xl border border-[#161616]">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/65 text-[11px] uppercase tracking-wider border-b border-[#161616]">
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
            const races = breakdowns?.[d.Driver.driverId]
            const canExpand = !!races && races.length > 0
            const isOpen = openId === d.Driver.driverId

            return (
              <RowGroup key={d.Driver.driverId}>
                <tr
                  className={`border-b border-[#0f0f0f] transition-colors ${
                    canExpand ? 'cursor-pointer hover:bg-white/[0.03]' : ''
                  } ${isOpen ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                  onClick={canExpand ? () => setOpenId(isOpen ? null : d.Driver.driverId) : undefined}
                  {...(canExpand
                    ? {
                        role: 'button',
                        tabIndex: 0,
                        'aria-expanded': isOpen,
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setOpenId(isOpen ? null : d.Driver.driverId)
                          }
                        },
                      }
                    : {})}
                >
                  <td className="py-3 px-4 text-[#aaaaaa] font-mono">{d.position}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-white font-medium">
                        {d.Driver.givenName} {d.Driver.familyName}
                      </span>
                      {d.Driver.code && (
                        <span className="text-white/65 text-[10px] font-mono hidden md:inline">
                          {d.Driver.code}
                        </span>
                      )}
                      {canExpand && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                          className={`text-white/50 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        >
                          <path
                            d="M4 6l4 4 4-4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#aaaaaa] hidden sm:table-cell">
                    {d.Constructors[0]?.name ?? '—'}
                  </td>
                  <td className="py-3 px-4 text-center text-[#aaaaaa] font-mono">{d.wins}</td>
                  <td className="py-3 px-4 text-right text-white font-mono font-semibold">{d.points}</td>
                </tr>

                {canExpand && isOpen && (
                  <tr className="border-b border-[#0f0f0f]">
                    <td colSpan={5} className="p-0 bg-black">
                      <div
                        className="m-2 sm:m-3 rounded-xl border border-[#242424] bg-[#0d0d0d] px-3 sm:px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
                        style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                      >
                        <PointsBreakdown races={races} accent={color} />
                      </div>
                    </td>
                  </tr>
                )}
              </RowGroup>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// A tbody-less fragment wrapper so the main + breakdown rows stay adjacent.
function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function PointsBreakdown({ races, accent }: { races: DriverRaceEntry[]; accent: string }) {
  const totalRace = races.reduce((s, r) => s + r.racePoints, 0)
  const totalSprint = races.reduce((s, r) => s + r.sprintPoints, 0)
  const anySprint = races.some((r) => r.hasSprint)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest">
          Points by Race
        </p>
        <p className="text-white/65 text-[10px] font-mono">
          {totalRace} race{anySprint ? ` · ${totalSprint} sprint` : ''} pts
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {races.map((r) => {
          const scored = r.points > 0
          return (
            <div
              key={r.round}
              className="flex items-center gap-2.5 rounded-lg border border-[#161616] bg-[#0a0a0a] px-3 py-2"
              style={{ borderLeftColor: accent, borderLeftWidth: 2 }}
            >
              <span className="text-white/50 text-[10px] font-mono w-6 shrink-0">
                R{r.round}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-white text-xs font-medium truncate">
                  {r.raceName.replace('Grand Prix', 'GP')}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-mono ${
                      r.dnf ? 'text-[#e0554e]' : 'text-white/55'
                    }`}
                  >
                    {r.dnf ? 'DNF' : `P${r.position}`}
                  </span>
                  <span className="text-white/40 text-[10px] font-mono truncate">
                    {r.status}
                  </span>
                  {r.hasSprint && r.sprintPoints > 0 && (
                    <span className="text-[#d4a017] text-[10px] font-mono shrink-0">
                      Sprint +{r.sprintPoints}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`text-sm font-mono font-semibold shrink-0 ${
                  scored ? 'text-white' : 'text-white/35'
                }`}
              >
                {r.points}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
