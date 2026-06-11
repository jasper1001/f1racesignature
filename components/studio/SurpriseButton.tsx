'use client'

import { useQuery } from '@tanstack/react-query'
import { useStudioStore } from '@/lib/store'
import { fetchDrivers, fetchRaces } from '@/lib/data'
import { THEMES, VIZ_MODES } from '@/lib/themes'
import { Analytics } from '@/lib/analytics'

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function SurpriseButton() {
  const applyConfig = useStudioStore((s) => s.applyConfig)
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers })
  const { data: races = [] } = useQuery({ queryKey: ['races'], queryFn: fetchRaces })

  const surprise = () => {
    if (drivers.length === 0 || races.length === 0) return
    const driver = rand(drivers)
    const driverRaces = races.filter((r) => r.driverId === driver.id)
    if (driverRaces.length === 0) return
    const race = rand(driverRaces)
    applyConfig({
      driverId: driver.id,
      raceId: race.id,
      theme: rand(THEMES).id,
      vizMode: rand(VIZ_MODES).id,
    })
    Analytics.surpriseMe()
  }

  return (
    <button
      onClick={surprise}
      title="Surprise me"
      data-track="studio_surprise_me"
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#111111] text-[#aaaaaa] border border-[#222222] rounded-lg hover:text-white hover:border-[#333333] transition-colors cursor-pointer"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M11 2h3v3M14 2l-4 4M5 14H2v-3M2 14l4-4M14 11v3h-3M14 14l-4-4M2 5V2h3M2 2l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hidden sm:inline">Surprise</span>
    </button>
  )
}
