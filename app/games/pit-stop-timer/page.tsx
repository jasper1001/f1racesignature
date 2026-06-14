import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PitStopTimerGame } from '@/components/games/PitStopTimerGame'

export const metadata: Metadata = {
  title: 'Pit Stop Timer',
  description: 'Can you release the F1 car at the perfect moment? Time your release against the target stop time in this precision pit wall game.',
  alternates: { canonical: '/games/pit-stop-timer' },
  openGraph: {
    title: 'Pit Stop Timer | F1RaceSignature',
    description: 'Release the car at the perfect moment. Too early is unsafe. Too late loses positions.',
    url: '/games/pit-stop-timer',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
}

export default function PitStopTimerPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>

        {/* Hero */}
        <div className="relative border-b border-[#0f0f0f] py-16 px-6 text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 70%)',
            }}
          />
          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#06b6d4' }}>
            Pit Wall
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Pit Stop Timer
          </h1>
          <p className="relative text-white text-sm max-w-sm mx-auto opacity-50">
            Can you release the car at the perfect moment?
          </p>
        </div>

        {/* Game */}
        <div className="max-w-lg mx-auto">
          <PitStopTimerGame />
        </div>

      </main>
      <Footer />
    </>
  )
}
