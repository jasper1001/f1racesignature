'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { GALLERY_ITEMS } from '@/lib/gallery'
import { fetchCircuits, fetchTelemetry } from '@/lib/data'
import { GalleryCard } from '@/components/gallery/GalleryCard'
import type { Circuit, Telemetry } from '@/lib/types'

const FEATURED = GALLERY_ITEMS.slice(0, 4)

function FeaturedCardLoader({
  item,
  index,
  circuits,
}: {
  item: typeof FEATURED[0]
  index: number
  circuits: Record<string, Circuit>
}) {
  const { data: telemetry = null } = useQuery<Telemetry>({
    queryKey: ['telemetry', item.raceId],
    queryFn: () => fetchTelemetry(item.raceId),
  })

  return (
    <GalleryCard
      item={item}
      index={index}
      circuit={circuits[item.circuitId] ?? null}
      telemetry={telemetry}
    />
  )
}

export function FeaturedGallery() {
  const { data: circuits = {} } = useQuery({
    queryKey: ['circuits'],
    queryFn: fetchCircuits,
  })

  return (
    <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 md:mb-12"
        >
          <div>
            <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-3">
              Featured Posters
            </p>
            <h2
              className="text-4xl text-white"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              The Hall of Fame
            </h2>
          </div>
          <Link
            href="/gallery"
            className="text-[#aaaaaa] text-sm hover:text-white transition-colors flex items-center gap-1.5"
          >
            View all 12 posters
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {FEATURED.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <FeaturedCardLoader item={item} index={i} circuits={circuits} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
