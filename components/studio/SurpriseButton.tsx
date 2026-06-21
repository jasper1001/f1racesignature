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
        {/* Sparkles — "surprise me" */}
        <path d="M6.5 1.5C6.8 4.4 8.1 5.7 11 6C8.1 6.3 6.8 7.6 6.5 10.5C6.2 7.6 4.9 6.3 2 6C4.9 5.7 6.2 4.4 6.5 1.5Z" fill="currentColor" />
        <path d="M12 8.5C12.15 9.85 12.65 10.35 14 10.5C12.65 10.65 12.15 11.15 12 12.5C11.85 11.15 11.35 10.65 10 10.5C11.35 10.35 11.85 9.85 12 8.5Z" fill="currentColor" />
      </svg>
      <span className="hidden sm:inline">Surprise</span>
    </button>
  )
}
