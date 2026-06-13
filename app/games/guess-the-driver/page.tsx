import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GuessTheDriverGame } from '@/components/games/GuessTheDriverGame'

export const metadata: Metadata = {
  title: 'Guess the Driver',
  description: 'Can you identify the F1 driver before all the clues are revealed? Test your Formula 1 knowledge across 53 drivers from every era.',
  alternates: { canonical: '/games/guess-the-driver' },
  openGraph: {
    title: 'Guess the Driver | F1RaceSignature',
    description: 'Identify the F1 driver from clues. Fewer clues = higher score.',
    url: '/games/guess-the-driver',
    type: 'website',
  },
}

export default function GuessTheDriverPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Breadcrumb */}
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
              F1 Knowledge
            </p>
            <h1
              className="text-4xl md:text-5xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Guess the Driver
            </h1>
            <p className="text-white text-sm max-w-sm mx-auto leading-relaxed">
              Clues are revealed one at a time. Guess early for maximum points.
              53 drivers spanning every era of Formula 1.
            </p>
          </div>

          <GuessTheDriverGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
