'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { GalleryCard } from './GalleryCard'
import { GALLERY_ITEMS } from '@/lib/gallery'
import { isRaceFree } from '@/lib/freemium'
import { fetchCircuits, fetchTelemetry } from '@/lib/data'
import type { Circuit, Telemetry } from '@/lib/types'

const FILTERS = ['All', 'Free', 'Hamilton', 'Verstappen', 'Senna', 'Schumacher', 'Premium']

export function GalleryGrid() {
  const [activeFilter, setActiveFilter] = useState('All')

  const { data: circuits = {} } = useQuery({
    queryKey: ['circuits'],
    queryFn: fetchCircuits,
  })

  const filtered = GALLERY_ITEMS.filter((item) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Free') return !item.isPremium || isRaceFree(item.raceId)
    if (activeFilter === 'Premium') return item.isPremium && !isRaceFree(item.raceId)
    return item.driverId === activeFilter.toLowerCase()
  })

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-10 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeFilter === f
                ? 'bg-[#d4a017] text-black'
                : 'bg-[#0f0f0f] text-[#555555] border border-[#1a1a1a] hover:text-white hover:border-[#333333]'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-[#444444] text-xs">{filtered.length} posters</span>
      </div>

      <motion.div
        key={activeFilter}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
      >
        {filtered.map((item, i) => (
          <GalleryCardLoader
            key={item.id}
            item={item}
            index={i}
            circuit={circuits[item.circuitId] ?? null}
          />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-[#333333] text-sm">
          No posters found for this filter.
        </div>
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
  const { data: telemetry = null } = useQuery({
    queryKey: ['telemetry', item.raceId],
    queryFn: () => fetchTelemetry(item.raceId),
  })

  return <GalleryCard item={item} index={index} circuit={circuit} telemetry={telemetry} />
}
