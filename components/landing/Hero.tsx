'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SteeringWheelIcon } from '@/components/icons/SteeringWheel'

const FEATURES = [
  {
    href: '/studio',
    tag: 'Create',
    title: 'Studio',
    description: 'Build poster art from real F1 telemetry — racing lines, speed heatmaps, and sector splits.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/gallery',
    tag: 'Explore',
    title: 'Gallery',
    description: 'Browse the full collection of community-generated race posters.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: '/results',
    tag: 'Live',
    title: '2026 Season',
    description: 'Live driver standings, constructor points, and the full race calendar.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 17V11M10 17V4M15 17V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    live: true,
  },
  {
    href: '/games',
    tag: 'Play',
    title: 'Mini Games',
    description: 'Reaction tests, driver quizzes, circuit challenges, and pit-wall strategy.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="6" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 12v-2M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="12" r="1" fill="currentColor" />
        <circle cx="11" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
  },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background grid */}
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

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: tagline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d4a017]/20 bg-[#d4a017]/5 text-[#d4a017] text-xs font-medium tracking-wide mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
              F1 Telemetry Art Generator
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl text-white leading-[0.95] mb-6"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Where Speed
              <br />
              <span className="text-[#d4a017]">Becomes Art</span>
            </h1>

            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-10 max-w-lg">
              Transform legendary F1 lap data into collectible poster art.
              Racing lines, speed traces, and sector data rendered as cinematic prints
              you&apos;d hang in a museum.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3">
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

          {/* Right: feature cards 2×2 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-3"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.08 }}
                className="h-full"
              >
                <Link
                  href={feature.href}
                  className="group flex flex-col h-full p-5 rounded-2xl border border-[#1a1a1a] bg-[#080808] hover:border-[#d4a017]/30 hover:bg-[#090907] transition-all duration-300 relative overflow-hidden"
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(212,160,23,0.05) 0%, transparent 70%)' }}
                  />

                  <div className="relative flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-[#d4a017]">{feature.icon}</div>
                      {feature.live && (
                        <span className="flex items-center gap-1 text-[#38b000] text-[10px] font-mono uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38b000] animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>

                    <p className="text-white/50 text-[10px] font-mono uppercase tracking-widest mb-1">
                      {feature.tag}
                    </p>
                    <h3
                      className="text-lg text-white mb-2 group-hover:text-[#d4a017] transition-colors duration-200"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-white/60 text-xs leading-relaxed flex-1">
                      {feature.description}
                    </p>

                    <div className="mt-4 flex justify-end">
                      <svg
                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                        className="text-[#2a2a2a] group-hover:text-[#d4a017] transition-colors duration-200"
                      >
                        <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
