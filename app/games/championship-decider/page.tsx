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

export default function ChampionshipDeciderPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        <div className="border-b border-[#0a0a0a] py-4 px-6">
          <div className="max-w-lg mx-auto">
            <Link
              href="/games"
              className="inline-flex items-center gap-1.5 text-[#888888] text-xs font-mono uppercase tracking-widest hover:text-white transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 6H3M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mini Games
            </Link>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <p className="text-[#444444] text-xs font-mono uppercase tracking-widest mb-3">
              F1 Strategy
            </p>
            <h1
              className="text-4xl md:text-5xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Championship Decider
            </h1>
            <p className="text-white text-sm max-w-sm mx-auto leading-relaxed">
              Relive real F1 strategy moments and decide what you would do from the pit wall.
              Would you survive as an F1 strategist?
            </p>
          </div>

          <ChampionshipDeciderGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
