import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ChampionshipDeciderGame } from '@/components/games/ChampionshipDeciderGame'

export const metadata: Metadata = {
  title: 'Championship Decider Quiz',
  description: 'Relive real F1 strategy moments and make the calls from the pit wall. Would you have made the right decision at Abu Dhabi 2021, Monaco 2016, or Turkey 2020?',
  alternates: { canonical: '/games/championship-decider' },
  openGraph: {
    title: 'Championship Decider Quiz | F1RaceSignature',
    description: 'Real F1 strategy scenarios. You decide from the pit wall.',
    url: '/games/championship-decider',
    type: 'website',
  },
}

const ACCENT = '#3b82f6'

export default function ChampionshipDeciderPage() {
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
            className="relative inline-flex items-center gap-1.5 text-white text-xs font-mono uppercase tracking-widest hover:text-[#3b82f6] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            F1 Strategy
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Championship Decider
          </h1>
          <p className="relative text-white text-sm max-w-sm mx-auto leading-relaxed">
            Relive real F1 strategy moments and decide what you would do from the pit wall.
            Would you survive as an F1 strategist?
          </p>
        </div>

        <div className="max-w-lg mx-auto px-6 py-12">
          <ChampionshipDeciderGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
