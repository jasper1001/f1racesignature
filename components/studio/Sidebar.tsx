'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LockBadge } from '@/components/ui/LockBadge'
import { useStudioStore, MAX_COMPARE } from '@/lib/store'
import { isDriverFree, isRaceFree, isVizModeFree, isThemeFree, isExportFree, UPGRADE_REASONS } from '@/lib/freemium'
import { THEMES, VIZ_MODES, EXPORT_FORMATS } from '@/lib/themes'
import { Analytics } from '@/lib/analytics'
import type { Driver, Race, VizMode, ArtTheme, ExportFormat } from '@/lib/types'

interface SidebarProps {
  drivers: Driver[]
  races: Race[]
  mobile?: boolean
}

export function Sidebar({ drivers, races, mobile = false }: SidebarProps) {
  const {
    selectedDriverId,
    selectedRaceId,
    vizMode,
    theme,
    exportFormat,
    compareEnabled,
    compareRaceIds,
    setDriver,
    setRace,
    setVizMode,
    setTheme,
    setExportFormat,
    toggleCompare,
    toggleCompareRace,
    openUpgradeModal,
  } = useStudioStore()

  const driverRaces = races.filter((r) => r.driverId === selectedDriverId)

  // Races on the SAME circuit as the current selection (for head-to-head)
  const primaryRace = races.find((r) => r.id === selectedRaceId)
  const compareCandidates = primaryRace
    ? races.filter((r) => r.circuit === primaryRace.circuit && r.id !== primaryRace.id)
    : []

  const driverById = (id: string) => drivers.find((d) => d.id === id)

  const handleDriverSelect = (driverId: string) => {
    if (!isDriverFree(driverId)) {
      Analytics.upgradeModalOpened('driver')
      openUpgradeModal(UPGRADE_REASONS.driver)
      return
    }
    Analytics.driverSelected(driverId)
    setDriver(driverId)
  }

  const handleRaceSelect = (raceId: string) => {
    if (!isRaceFree(raceId)) {
      Analytics.upgradeModalOpened('race')
      openUpgradeModal(UPGRADE_REASONS.race)
      return
    }
    Analytics.raceSelected(raceId)
    setRace(raceId)
  }

  const handleVizMode = (mode: VizMode) => {
    if (!isVizModeFree(mode)) {
      Analytics.upgradeModalOpened('vizMode')
      openUpgradeModal(UPGRADE_REASONS.vizMode)
      return
    }
    Analytics.vizModeChanged(mode)
    setVizMode(mode)
  }

  const handleTheme = (t: ArtTheme) => {
    if (!isThemeFree(t)) {
      Analytics.upgradeModalOpened('theme')
      openUpgradeModal(UPGRADE_REASONS.theme)
      return
    }
    Analytics.themeChanged(t)
    setTheme(t)
  }

  const handleExportFormat = (f: ExportFormat) => {
    if (!isExportFree(f)) {
      Analytics.upgradeModalOpened('exportFormat')
      openUpgradeModal(UPGRADE_REASONS.exportFormat)
      return
    }
    Analytics.exportFormatChanged(f)
    setExportFormat(f)
  }

  return (
    <aside className={`bg-[#0a0a0a] overflow-y-auto ${mobile ? 'w-full h-full' : 'w-60 flex-shrink-0 border-r border-[#111111] h-full'}`}>
      <div className="p-4 space-y-6">
        {/* Driver */}
        <Section title="Driver">
          <div className="grid grid-cols-2 gap-1.5">
            {drivers.map((d) => {
              const free = isDriverFree(d.id)
              const active = selectedDriverId === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => handleDriverSelect(d.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs cursor-pointer ${
                    active
                      ? 'bg-white/8 border border-[#333333] text-white'
                      : 'bg-transparent border border-[#1a1a1a] text-[#aaaaaa] hover:text-white hover:border-[#2a2a2a]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="truncate font-medium">{d.shortName}</span>
                  {!free && (
                    <LockBadge className="ml-auto text-[#aaaaaa]" />
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Race */}
        <Section title="Race">
          <div className="space-y-1">
            {driverRaces.length === 0 && (
              <p className="text-[#aaaaaa] text-xs px-1 py-2">Select a driver first</p>
            )}
            {driverRaces.map((r) => {
              const free = isRaceFree(r.id)
              const active = selectedRaceId === r.id
              return (
                <button
                  key={r.id}
                  onClick={() => handleRaceSelect(r.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-white/8 border border-[#333333]'
                      : 'border border-transparent hover:border-[#1a1a1a] hover:bg-white/3'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{r.circuit.toUpperCase()} {r.year}</div>
                    <div className="text-[10px] text-[#aaaaaa] mt-0.5">{r.lapTime}</div>
                  </div>
                  {!free && <LockBadge className="text-[#aaaaaa] ml-2" />}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Visualization Mode */}
        <Section title="Visualization">
          <div className="space-y-1">
            {VIZ_MODES.map((vm) => {
              const active = vizMode === vm.id
              return (
                <button
                  key={vm.id}
                  onClick={() => handleVizMode(vm.id as VizMode)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-white/8 border border-[#333333]'
                      : 'border border-transparent hover:border-[#1a1a1a] hover:bg-white/3'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-white">{vm.name}</div>
                    <div className="text-[10px] text-[#aaaaaa] mt-0.5">{vm.description}</div>
                  </div>
                  {!isVizModeFree(vm.id as VizMode) && <LockBadge className="text-[#aaaaaa] ml-2" />}
                </button>
              )
            })}
          </div>
        </Section>

        {/* Compare — head to head */}
        <Section title="Compare Laps">
          <button
            onClick={() => {
              Analytics.compareToggled(!compareEnabled)
              toggleCompare()
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all cursor-pointer border ${
              compareEnabled ? 'bg-white/8 border-[#333333]' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
            }`}
          >
            <div className="text-xs font-medium text-white">Head-to-head overlay</div>
            <span
              className={`relative w-8 h-4 rounded-full transition-colors ${compareEnabled ? 'bg-[#d4a017]' : 'bg-[#2a2a2a]'}`}
            >
              <span
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${compareEnabled ? 'left-4' : 'left-0.5'}`}
              />
            </span>
          </button>

          {compareEnabled && (
            <div className="mt-2 space-y-1">
              {compareCandidates.length === 0 ? (
                <p className="text-[10px] text-[#aaaaaa] px-1 py-2">
                  No other laps on this circuit yet. Pick a race at Monaco, Monza, Spa, Interlagos or Suzuka to compare.
                </p>
              ) : (
                <>
                  <p className="text-[10px] text-[#aaaaaa] px-1 pb-1">
                    Pick up to {MAX_COMPARE} laps ({compareRaceIds.length}/{MAX_COMPARE})
                  </p>
                  {compareCandidates.map((r) => {
                    const cd = driverById(r.driverId)
                    const checked = compareRaceIds.includes(r.id)
                    const atMax = !checked && compareRaceIds.length >= MAX_COMPARE
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggleCompareRace(r.id)}
                        disabled={atMax}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                          checked ? 'bg-white/8 border border-[#333333]' : 'border border-transparent hover:border-[#1a1a1a] hover:bg-white/3'
                        } ${atMax ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {/* Checkbox */}
                        <span
                          className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                            checked ? 'bg-[#d4a017] border-[#d4a017]' : 'border-[#3a3a3a]'
                          }`}
                        >
                          {checked && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="#030303" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cd?.color ?? '#888' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white truncate">{cd?.shortName} · {r.year}</div>
                          <div className="text-[10px] text-[#aaaaaa]">{r.lapTime}</div>
                        </div>
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </Section>

        {/* Theme */}
        <Section title="Artistic Theme">
          <div className="grid grid-cols-2 gap-1.5">
            {THEMES.map((t) => {
              const active = theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => handleTheme(t.id as ArtTheme)}
                  className={`relative flex flex-col gap-2 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    active
                      ? 'border border-[#444444]'
                      : 'border border-[#1a1a1a] hover:border-[#2a2a2a]'
                  }`}
                  style={{ background: t.bg }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-5 h-1.5 rounded-full"
                      style={{ backgroundColor: t.primaryLine }}
                    />
                    {!isThemeFree(t.id as ArtTheme) && <LockBadge className="text-[#aaaaaa]" />}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: t.textColor }}>
                    {t.name}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Export Format */}
        <Section title="Export Format">
          <div className="space-y-1">
            {EXPORT_FORMATS.map((f) => {
              const isAvailable = f.id === 'poster_portrait' || f.id === 'square_instagram'
              const active = exportFormat === f.id
              return (
                <button
                  key={f.id}
                  onClick={() => isAvailable && handleExportFormat(f.id as ExportFormat)}
                  disabled={!isAvailable}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    !isAvailable
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  } ${
                    active
                      ? 'bg-white/8 border border-[#333333]'
                      : 'border border-transparent hover:border-[#1a1a1a] hover:bg-white/3'
                  }`}
                >
                  <div>
                    <div className={`text-xs font-medium ${isAvailable ? 'text-white' : 'text-[#aaaaaa]'}`}>
                      {f.name}
                    </div>
                    <div className="text-[10px] text-[#aaaaaa]">{f.width}×{f.height}</div>
                  </div>
                  {!isAvailable && (
                    <span className="text-[9px] font-mono text-[#aaaaaa] border border-[#2a2a2a] rounded px-1.5 py-0.5 ml-2 whitespace-nowrap">
                      SOON
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Section>
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-medium text-[#aaaaaa] uppercase tracking-widest mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  )
}
