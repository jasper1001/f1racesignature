'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStudioStore } from '@/lib/store'
import { fetchDrivers, fetchRaces } from '@/lib/data'
import { isSaved, toggleSave } from '@/lib/garage'
import { Analytics } from '@/lib/analytics'

export function SaveButton() {
  const { selectedDriverId, selectedRaceId, vizMode, theme } = useStudioStore()
  const { data: drivers = [] } = useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers })
  const { data: races = [] } = useQuery({ queryKey: ['races'], queryFn: fetchRaces })
  const [saved, setSaved] = useState(false)

  const driver = drivers.find((d) => d.id === selectedDriverId)
  const race = races.find((r) => r.id === selectedRaceId)
  const disabled = !driver || !race

  useEffect(() => {
    if (!selectedDriverId || !selectedRaceId) return setSaved(false)
    setSaved(isSaved(selectedDriverId, selectedRaceId, theme, vizMode))
  }, [selectedDriverId, selectedRaceId, theme, vizMode])

  const onSave = () => {
    if (!driver || !race) return
    const nowSaved = toggleSave({
      driverId: driver.id,
      raceId: race.id,
      theme,
      vizMode,
      driverName: driver.name,
      raceName: race.name,
    })
    setSaved(nowSaved)
    if (nowSaved) Analytics.posterSaved(race.id)
  }

  return (
    <button
      onClick={onSave}
      disabled={disabled}
      title={saved ? 'Saved to your garage' : 'Save to your garage'}
      data-track="studio_save_garage"
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#111111] text-[#aaaaaa] border border-[#222222] rounded-lg hover:text-white hover:border-[#333333] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill={saved ? '#d4a017' : 'none'}>
        <path d="M8 2.5l1.6 3.4 3.7.4-2.8 2.5.8 3.6L8 12.9 4.7 14.9l.8-3.6L2.7 6.8l3.7-.4L8 2.5z"
          stroke={saved ? '#d4a017' : 'currentColor'} strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      <span className={`hidden sm:inline ${saved ? 'text-[#d4a017]' : ''}`}>{saved ? 'Saved' : 'Save'}</span>
    </button>
  )
}
