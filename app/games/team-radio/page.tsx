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
  },
}

export default function TeamRadioPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Hero */}
        <div className="border-b border-[#0f0f0f] py-16 px-6 text-center">
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 text-[#444444] text-xs font-mono uppercase tracking-widest hover:text-[#666666] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>
          <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-4">
            F1 Knowledge
          </p>
          <h1
            className="text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Team Radio Guess
          </h1>
          <p className="text-[#777777] max-w-sm mx-auto text-sm leading-relaxed">
            Famous quotes from the pit wall. Who said it on the radio?
          </p>
        </div>

        {/* Game */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <TeamRadioGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
