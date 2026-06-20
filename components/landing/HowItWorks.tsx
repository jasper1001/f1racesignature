'use client'

import { motion } from 'framer-motion'

const STEPS = [
  {
    number: '01',
    title: 'Choose Your Legend',
    description:
      'Select from 8 iconic F1 drivers — from Senna\'s perfect Monaco laps to Verstappen\'s title-winning charge.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Pick the Race',
    description:
      'From Monaco 1984 to Abu Dhabi 2021 — iconic races that changed history, each with real telemetry data.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M3 12h18M3 6h18M3 18h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Choose Your Visualization',
    description:
      'Racing line, speed heatmap, sector split, overtake map — six ways to see the data as art.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 14l4-4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Apply Your Theme',
    description:
      'Carbon Fiber. Championship Gold. Blueprint. Monaco Night — eight cinematic visual themes.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v9l6 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  return (
    <section className="py-12 md:py-14 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-4">
            How It Works
          </p>
          <h2
            className="text-4xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Four Steps to Museum Quality
          </h2>
          <p className="text-[#aaaaaa] max-w-xl mx-auto">
            From lap data to collectible art in seconds. No design skills required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="text-5xl font-bold text-white/20 font-mono mb-4">
                {step.number}
              </div>
              <div className="text-[#d4a017] mb-3">{step.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-2">{step.title}</h3>
              <p className="text-[#aaaaaa] text-xs leading-relaxed">{step.description}</p>

              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 right-0 w-px h-8 bg-[#1a1a1a]" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
