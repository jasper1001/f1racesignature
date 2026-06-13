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
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
}

const ACCENT = '#f97316'

export default function HigherLowerPage() {
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
            className="relative inline-flex items-center gap-1.5 text-white text-xs font-mono uppercase tracking-widest hover:text-[#f97316] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Stat Battle
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Higher or Lower
          </h1>
          <p className="relative text-white text-sm max-w-sm mx-auto leading-relaxed">
            Does Driver B have more or fewer stats than Driver A? Build your streak — one wrong answer ends the game.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <HigherLowerGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
