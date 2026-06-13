import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HigherLowerGame } from '@/components/games/HigherLowerGame'

export const metadata: Metadata = {
  title: 'Higher or Lower: F1 Edition',
  description: 'Guess whether one F1 driver has more or fewer career stats than another. Wins, poles, podiums and more. How long can your streak last?',
  alternates: { canonical: '/games/higher-lower' },
  openGraph: {
    title: 'Higher or Lower: F1 Edition | F1RaceSignature',
    description: 'Does Hamilton have more wins than Schumacher? Test your F1 stat knowledge.',
    url: '/games/higher-lower',
    type: 'website',
  },
}

export default function HigherLowerPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Hero */}
        <div className="border-b border-[#0f0f0f] py-16 px-6 text-center">
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 text-white text-xs font-mono uppercase tracking-widest hover:text-[#d4a017] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>
          <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-4">
            Stat Battle
          </p>
          <h1
            className="text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Higher or Lower
          </h1>
          <p className="text-white max-w-sm mx-auto text-sm leading-relaxed">
            Does Driver B have more or fewer stats than Driver A? Build your streak — one wrong answer ends the game.
          </p>
        </div>

        {/* Game */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <HigherLowerGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
