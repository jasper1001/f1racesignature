import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PredictDriverGame } from '@/components/games/PredictDriverGame'

export const metadata: Metadata = {
  title: 'Predict the Driver',
  description: 'Wordle-style F1 driver guessing game. Identify the mystery driver in 6 attempts using nationality, wins, poles, debut year, and team hints.',
  alternates: { canonical: '/games/predict-driver' },
  openGraph: {
    title: 'Predict the Driver | F1RaceSignature',
    description: 'Can you identify the mystery F1 driver in 6 guesses?',
    url: '/games/predict-driver',
    type: 'website',
  },
}

export default function PredictDriverPage() {
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
            Predict the Driver
          </h1>
          <p className="text-[#777777] max-w-sm mx-auto text-sm leading-relaxed">
            Can you identify the mystery F1 driver in 6 guesses?
          </p>
        </div>

        {/* Game */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <PredictDriverGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
