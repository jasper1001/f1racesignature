import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TeamRadioGame } from '@/components/games/TeamRadioGame'

export const metadata: Metadata = {
  title: 'Team Radio Guess',
  description: 'Identify F1 drivers from their most famous team radio transmissions. 30 legendary quotes.',
  alternates: { canonical: '/games/team-radio' },
  openGraph: {
    title: 'Team Radio Guess | F1RaceSignature',
    description: 'Who said it on the radio? Guess the driver behind 30 iconic F1 transmissions.',
    url: '/games/team-radio',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
}

const ACCENT = '#10b981'

export default function TeamRadioPage() {
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
            className="relative inline-flex items-center gap-1.5 text-white text-xs font-mono uppercase tracking-widest hover:text-[#10b981] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            F1 Knowledge
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Team Radio Guess
          </h1>
          <p className="relative text-white text-sm max-w-sm mx-auto leading-relaxed">
            Famous quotes from the pit wall. Who said it on the radio?
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-16">
          <TeamRadioGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
