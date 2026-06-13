'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchCircuits, fetchTelemetry } from '@/lib/data'
import { SteeringWheelIcon } from '@/components/icons/SteeringWheel'
import type { Circuit, Telemetry } from '@/lib/types'

const HERO_POSTERS = [
  { label: 'HAM', circuit: 'silverstone', raceId: 'hamilton_silverstone_2020', color: '#00d2be', caption: 'SILVERSTONE 2020', rotate: -6, large: false, delay: 0.1 },
  { label: 'SEN', circuit: 'monaco',      raceId: 'senna_monaco_1984',         color: '#38b000', caption: 'MONACO 1984',      rotate: 0,  large: true,  delay: 0 },
  { label: 'VER', circuit: 'abu_dhabi',   raceId: 'verstappen_abu_dhabi_2021', color: '#1e41ff', caption: 'ABU DHABI 2021',   rotate: 6,  large: false, delay: 0.2 },
]

export function Hero() {
  const { data: circuits = {} } = useQuery({ queryKey: ['circuits'], queryFn: fetchCircuits })

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(212,160,23,0.06) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to bottom, transparent, #030303)' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4a017]/20 bg-[#d4a017]/5 text-[#d4a017] text-xs font-medium tracking-wide mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
            F1 Telemetry Art Generator
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl text-white leading-[0.95] mb-5 md:mb-6" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Where Speed
            <br />
            <span className="text-[#d4a017]">Becomes Art</span>
          </h1>

          <p className="text-[#666666] text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 md:mb-10 px-2">
            Transform legendary F1 lap data into collectible poster art.
            Racing lines, speed traces, and sector data rendered as cinematic prints
            you&apos;d hang in a museum.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/studio"
              className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100"
            >
              <SteeringWheelIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Create Your Poster
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/8 hover:border-white/15 transition-all"
            >
              View Gallery
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </motion.div>

        {/* Floating poster previews — hidden on xs, visible from sm up */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 md:mt-20 relative hidden sm:block"
        >
          <div className="flex items-end justify-center gap-2 md:gap-4">
            {HERO_POSTERS.map((p) => (
              <HeroPoster
                key={p.raceId}
                {...p}
                circuitData={circuits[p.circuit] ?? null}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: 'linear-gradient(to bottom, transparent, #030303)' }} />
        </motion.div>
      </div>
    </section>
  )
}

function HeroPoster({
  label,
  raceId,
  color,
  caption,
  rotate,
  large,
  delay,
  circuitData,
}: {
  label: string
  raceId: string
  color: string
  caption: string
  rotate: number
  large: boolean
  delay: number
  circuitData: Circuit | null
}) {
  const { data: telemetry = null } = useQuery<Telemetry>({
    queryKey: ['telemetry', raceId],
    queryFn: () => fetchTelemetry(raceId),
  })

  const w = large ? 180 : 138
  const h = large ? 240 : 184

  // Circuit area inside the mini poster
  const cx = w * 0.08
  const cy = h * 0.13
  const cw = w * 0.84
  const ch = h * 0.66

  const scaleX = cw / 500
  const scaleY = ch / 420

  // Build racing line from telemetry
  const racingPath = telemetry && telemetry.points.length > 1
    ? telemetry.points.map((pt, i) => {
        const px = cx + pt.x * cw
        const py = cy + pt.y * ch
        return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`
      }).join(' ')
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 + delay }}
      style={{ transform: `rotate(${rotate}deg)`, transformOrigin: 'bottom center' }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="rounded-lg"
        style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${color}22` }}
      >
        <rect width={w} height={h} fill="#080808" />

        {/* Subtle radial glow */}
        <radialGradient id={`hg-${raceId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor="#080808" stopOpacity="0" />
        </radialGradient>
        <rect width={w} height={h} fill={`url(#hg-${raceId})`} />

        {/* Top accent */}
        <line x1="0" y1="0" x2={w} y2="0" stroke={color} strokeWidth="2" opacity="0.6" />

        {/* Driver label */}
        <text x={w / 2} y={h * 0.09} textAnchor="middle" fill={color}
          fontSize={large ? 16 : 12} fontFamily="Georgia, serif" fontStyle="italic">
          {label}
        </text>

        {/* Asphalt track */}
        {circuitData && (
          <g transform={`translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY})`}>
            <path d={circuitData.path} fill="none" stroke="#2a2a2a" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
            <path d={circuitData.path} fill="none" stroke="#3a3a3a" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d={circuitData.path} fill="none" stroke="#4a4a4a" strokeWidth="5"  strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {/* Racing line */}
        {racingPath && (
          <>
            <path d={racingPath} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" />
            <path d={racingPath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
          </>
        )}

        {/* Caption */}
        <text x={w / 2} y={h * 0.89} textAnchor="middle" fill="#444444"
          fontSize="6.5" fontFamily="monospace" letterSpacing="2">
          {caption}
        </text>

        {/* Bottom accent */}
        <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke={color} strokeWidth="1.5" opacity="0.3" />
      </svg>
    </motion.div>
  )
}
