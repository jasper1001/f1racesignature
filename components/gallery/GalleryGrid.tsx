'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { GalleryCard } from './GalleryCard'
import { GALLERY_ITEMS } from '@/lib/gallery'
import { fetchCircuits, fetchTelemetry } from '@/lib/data'
import { hasSeen, markSeen } from '@/lib/onboarding'
import type { Circuit, Telemetry } from '@/lib/types'

// Readable names for circuit ids (fallback if circuits.json hasn't loaded)
const TRACK_LABELS: Record<string, string> = {
  monaco: 'Monaco',
  monza: 'Monza',
  spa: 'Spa',
  silverstone: 'Silverstone',
  suzuka: 'Suzuka',
  interlagos: 'Interlagos',
  bahrain: 'Bahrain',
  abu_dhabi: 'Abu Dhabi',
  hungaroring: 'Hungaroring',
  miami: 'Miami',
  marina_bay: 'Singapore',
}

const DRIVER_LABELS: Record<string, string> = {
  hamilton: 'Hamilton',
  verstappen: 'Verstappen',
  senna: 'Senna',
  schumacher: 'Schumacher',
  prost: 'Prost',
  lauda: 'Lauda',
  alonso: 'Alonso',
  vettel: 'Vettel',
  leclerc: 'Leclerc',
  norris: 'Norris',
  russell: 'Russell',
  sainz: 'Sainz',
}

type Filter = { type: 'all' } | { type: 'driver'; value: string } | { type: 'track'; value: string }

export function GalleryGrid() {
  const [filter, setFilter] = useState<Filter>({ type: 'all' })
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    if (!hasSeen('gallery_tip')) setShowTip(true)
  }, [])
  const dismissTip = () => {
    markSeen('gallery_tip')
    setShowTip(false)
  }

  const { data: circuits = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })

  // Only show filter chips for drivers/tracks that actually have posters
  const { drivers, tracks } = useMemo(() => {
    const driverSet = new Set<string>()
    const trackSet = new Set<string>()
    for (const item of GALLERY_ITEMS) {
      driverSet.add(item.driverId)
      trackSet.add(item.circuitId)
    }
    return {
      drivers: [...driverSet].sort((a, b) => (DRIVER_LABELS[a] ?? a).localeCompare(DRIVER_LABELS[b] ?? b)),
      tracks: [...trackSet].sort((a, b) => (TRACK_LABELS[a] ?? a).localeCompare(TRACK_LABELS[b] ?? b)),
    }
  }, [])

  const filtered = GALLERY_ITEMS.filter((item) => {
    if (filter.type === 'all') return true
    if (filter.type === 'driver') return item.driverId === filter.value
    return item.circuitId === filter.value
  })

  const isActive = (f: Filter) =>
    f.type === filter.type && (f.type === 'all' || ('value' in f && 'value' in filter && f.value === filter.value))

  const chipClass = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-[#d4a017] text-black'
        : 'bg-[#0f0f0f] text-[#555555] border border-[#1a1a1a] hover:text-white hover:border-[#333333]'
    }`

  return (
    <div>
      {/* Onboarding tip */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6 rounded-xl border border-[#d4a017]/20 bg-[#d4a017]/5 px-4 py-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#d4a017] flex-shrink-0">
                <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2zM9 21h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[#aaaaaa] text-xs flex-1">
                <span className="text-white font-medium">Tip:</span> tap any poster to open it in the Studio — then change the driver, theme, or visualization and make it your own.
              </p>
              <button onClick={dismissTip} className="text-[#666666] hover:text-white transition-colors flex-shrink-0 cursor-pointer" aria-label="Dismiss">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All + count */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setFilter({ type: 'all' })} className={chipClass(filter.type === 'all')}>
          All Posters
        </button>
        <span className="text-[#444444] text-xs">{filtered.length} {filtered.length === 1 ? 'poster' : 'posters'}</span>
      </div>

      {/* Driver filters */}
      <div className="mb-3">
        <span className="block text-[10px] font-medium text-[#444444] uppercase tracking-widest mb-2">Driver</span>
        <div className="flex flex-wrap gap-2">
          {drivers.map((d) => (
            <button key={d} onClick={() => setFilter({ type: 'driver', value: d })} className={chipClass(isActive({ type: 'driver', value: d }))}>
              {DRIVER_LABELS[d] ?? d}
            </button>
          ))}
        </div>
      </div>

      {/* Track filters */}
      <div className="mb-8 md:mb-10">
        <span className="block text-[10px] font-medium text-[#444444] uppercase tracking-widest mb-2">Track</span>
        <div className="flex flex-wrap gap-2">
          {tracks.map((t) => (
            <button key={t} onClick={() => setFilter({ type: 'track', value: t })} className={chipClass(isActive({ type: 'track', value: t }))}>
              {circuits[t]?.name?.replace('Circuit', '').trim() ?? TRACK_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={`${filter.type}-${'value' in filter ? filter.value : 'all'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
      >
        {filtered.map((item, i) => (
          <GalleryCardLoader key={item.id} item={item} index={i} circuit={circuits[item.circuitId] ?? null} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-[#333333] text-sm">No posters found for this filter.</div>
      )}
    </div>
  )
}

function GalleryCardLoader({
  item,
  index,
  circuit,
}: {
  item: (typeof GALLERY_ITEMS)[0]
  index: number
  circuit: Circuit | null
}) {
  const { data: telemetry = null } = useQuery<Telemetry>({
    queryKey: ['telemetry', item.raceId],
    queryFn: () => fetchTelemetry(item.raceId),
  })

  return <GalleryCard item={item} index={index} circuit={circuit} telemetry={telemetry} />
}
