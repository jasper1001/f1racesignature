import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LightsOutGame } from '@/components/games/LightsOutGame'

export const metadata: Metadata = {
  title: 'Lights Out — Reaction Test',
  description:
    'Test your F1 reflexes. Watch the starting lights illuminate one by one — then react the instant they go out. How fast are you?',
  alternates: { canonical: '/games/lights-out' },
  openGraph: {
    title: 'Lights Out — Reaction Test | F1RaceSignature',
    description: 'Test your F1 reflexes. React the moment the lights go out.',
    url: '/games/lights-out',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
}

const ACCENT = '#ef4444'

export default function LightsOutPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>

        {/* Hero */}
        <div className="relative border-b border-[#0f0f0f] py-16 px-6 text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${ACCENT}14 0%, transparent 70%)`,
            }}
          />

          <Link
            href="/games"
            className="relative inline-flex items-center gap-1.5 text-white text-xs font-mono uppercase tracking-widest hover:text-[#ef4444] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Reaction Test
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Lights Out
          </h1>
          <p className="relative text-white text-sm max-w-sm mx-auto leading-relaxed">
            Five lights illuminate one by one. React the instant they all go dark.
            Jump the start and you&apos;ll have to go again.
          </p>
        </div>

        <div className="max-w-lg mx-auto px-6 py-12">
          {/* Ratings reference */}
          <div className="grid grid-cols-2 gap-2 mb-8">
            {[
              { label: 'Under 180ms', rating: 'Elite Reflexes',   color: '#d4a017' },
              { label: '180 – 250ms', rating: 'F1 Driver Level',  color: '#c0c0c0' },
              { label: '251 – 350ms', rating: 'Great Reaction',   color: '#cd7f32' },
              { label: 'Above 350ms', rating: 'Keep Practicing',  color: '#888888' },
            ].map((r) => (
              <div
                key={r.rating}
                className="rounded-xl border border-[#111111] bg-[#060606] px-3 py-2.5"
              >
                <p className="text-[10px] font-mono text-white uppercase tracking-wider opacity-50">{r.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: r.color }}>{r.rating}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#060606] overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 0 0 1px rgba(239,68,68,0.06), 0 0 40px rgba(239,68,68,0.06)' }}>
            <LightsOutGame />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
