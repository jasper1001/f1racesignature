'use client'

import { motion } from 'framer-motion'
import type { Driver, Race, Telemetry } from '@/lib/types'
import type { ComparisonLap } from './PosterPreview'
import { teamAtYear } from '@/lib/driverTeams'

interface StatsPanelProps {
  driver: Driver | null
  race: Race | null
  telemetry: Telemetry | null
  mobile?: boolean
  compares?: ComparisonLap[]
}

function lapSecs(s: string): number {
  const [m, sec] = s.split(':')
  return parseInt(m) * 60 + parseFloat(sec)
}

// Livery colour the driver actually raced for that year (matches the poster).
function colorFor(d: Driver, r: Race | null): string {
  return (r && r.driverId === d.id ? teamAtYear(d.id, r.year)?.color : null) ?? d.color
}

export function StatsPanel({ driver, race, telemetry, mobile = false, compares = [] }: StatsPanelProps) {
  const validCompares = compares.filter((c) => c.driver && c.telemetry)
  const comparing = Boolean(telemetry && validCompares.length > 0)
  if (!driver) {
    return (
      <div className={`flex items-center justify-center bg-[#0a0a0a] ${mobile ? 'w-full min-h-[60vh]' : 'w-56 flex-shrink-0 border-l border-[#111111]'}`}>
        <p className="text-[#aaaaaa] text-sm text-center px-6">
          Select a driver and race to see lap statistics
        </p>
      </div>
    )
  }

  return (
    <aside className={`bg-[#0a0a0a] overflow-y-auto ${mobile ? 'w-full' : 'w-56 flex-shrink-0 border-l border-[#111111]'}`}>
      <div className="p-4 space-y-5">
        {/* Driver card */}
        <div
          className="rounded-xl p-4 border border-[#1a1a1a]"
          style={{ borderLeftColor: driver.color, borderLeftWidth: 3 }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: driver.color + '22', border: `1px solid ${driver.color}44` }}
            >
              {driver.shortName}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{driver.name}</h3>
              <p className="text-[#aaaaaa] text-xs mt-0.5">{driver.team}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[#d4a017] text-xs">{'★'.repeat(Math.min(driver.championships, 5))}</span>
                <span className="text-[#aaaaaa] text-xs">{driver.championships}× Champion</span>
              </div>
            </div>
          </div>
          <p className="text-[#aaaaaa] text-xs mt-3 leading-relaxed line-clamp-3">
            {driver.bio}
          </p>
        </div>

        {/* Race info */}
        {race && (
          <StatGroup title="Race">
            <StatRow label="Circuit" value={race.circuitName} />
            <StatRow label="Year" value={String(race.year)} />
            <StatRow label="Location" value={race.location} />
          </StatGroup>
        )}

        {/* Lap telemetry */}
        {telemetry && (
          <>
            <StatGroup title="Lap Performance">
              <div className="flex items-baseline gap-1 mb-3">
                <span
                  className="text-3xl font-mono font-semibold tracking-tight"
                  style={{ color: driver.color }}
                >
                  {telemetry.lapTime}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <SectorBox label="S1" value={`${telemetry.sectors.s1Time.toFixed(1)}`} color="#00e676" />
                <SectorBox label="S2" value={`${telemetry.sectors.s2Time.toFixed(1)}`} color="#ffea00" />
                <SectorBox label="S3" value={`${telemetry.sectors.s3Time.toFixed(1)}`} color="#c800ff" />
              </div>
            </StatGroup>

            {/* Head-to-head leaderboard — every racer, fastest sector + lap highlighted */}
            {comparing && telemetry && (() => {
              const racers = [
                { name: driver.shortName, color: colorFor(driver, race), tel: telemetry },
                ...validCompares.map((c) => ({ name: c.driver!.shortName, color: colorFor(c.driver!, c.race), tel: c.telemetry! })),
              ]
              const sectorOf = (t: Telemetry, i: number) => [t.sectors.s1Time, t.sectors.s2Time, t.sectors.s3Time][i]
              const fastestSector = [0, 1, 2].map((i) => Math.min(...racers.map((r) => sectorOf(r.tel, i))))
              const minLap = Math.min(...racers.map((r) => lapSecs(r.tel.lapTime)))
              const sorted = [...racers].sort((a, b) => lapSecs(a.tel.lapTime) - lapSecs(b.tel.lapTime))
              const champ = sorted[0]
              const gaps = sorted.slice(1).map((r) => `${r.name} +${(lapSecs(r.tel.lapTime) - lapSecs(champ.tel.lapTime)).toFixed(3)}`)
              return (
                <div className="rounded-xl border border-[#1a1a1a] p-3">
                  <h4 className="text-[10px] font-medium text-[#d4a017] uppercase tracking-widest mb-1">
                    Head to Head
                  </h4>
                  {racers.map((r, ri) => {
                    const isFastestLap = Math.abs(lapSecs(r.tel.lapTime) - minLap) < 1e-6
                    return (
                      <div key={ri} className="py-1.5 border-t border-[#111111] first:border-t-0">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                            <span className="text-white text-xs font-medium truncate">{r.name}</span>
                          </span>
                          <span className={`font-mono text-xs ${isFastestLap ? 'text-[#00e676] font-semibold' : 'text-[#aaaaaa]'}`}>
                            {r.tel.lapTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 pl-3.5 text-[10px] font-mono">
                          {[0, 1, 2].map((i) => {
                            const v = sectorOf(r.tel, i)
                            const isFS = Math.abs(v - fastestSector[i]) < 1e-6
                            return (
                              <span key={i} className={isFS ? 'text-[#00e676]' : 'text-[#aaaaaa]'}>
                                S{i + 1} {v.toFixed(2)}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-center text-[10px] text-[#d4a017] mt-2 font-mono">
                    {champ.name} fastest{gaps.length ? ' · ' + gaps.join(' · ') : ''}
                  </p>
                </div>
              )
            })()}

            <StatGroup title="Telemetry">
              <StatRow label="Top Speed" value={`${telemetry.topSpeed} km/h`} highlight />
              <StatRow label="Avg Speed" value={`${telemetry.averageSpeed} km/h`} />
              <StatRow label="Data Points" value={`${telemetry.points.length} samples`} />
            </StatGroup>

            <StatGroup title="vs Benchmark">
              {(() => {
                const parseLap = (s: string) => {
                  const [m, sec] = s.split(':')
                  return parseInt(m) * 60 + parseFloat(sec)
                }
                const delta = parseLap(telemetry.lapTime) - parseLap(telemetry.benchmarkLapTime)
                const color = delta < 0 ? '#00e676' : '#ff4444'
                return (
                  <div>
                    <StatRow label="Benchmark" value={telemetry.benchmarkLapTime} />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[#aaaaaa] text-xs">Delta</span>
                      <span className="text-sm font-mono" style={{ color }}>
                        {delta < 0 ? '' : '+'}{delta.toFixed(3)}s
                      </span>
                    </div>
                  </div>
                )
              })()}
            </StatGroup>
          </>
        )}

        {race && (
          <div className="rounded-lg border border-[#111111] p-3">
            <p className="text-[#aaaaaa] text-xs leading-relaxed italic">
              "{race.description}"
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

function StatGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-[#aaaaaa] uppercase tracking-widest mb-2">
        {title}
      </h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#aaaaaa] text-xs">{label}</span>
      <span className={`text-xs font-mono ${highlight ? 'text-white' : 'text-[#aaaaaa]'}`}>
        {value}
      </span>
    </div>
  )
}

function SectorBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-md p-2 bg-[#111111] text-center">
      <div className="text-[10px] font-medium mb-1" style={{ color }}>
        {label}
      </div>
      <div className="text-xs font-mono text-white">{value}s</div>
    </div>
  )
}
