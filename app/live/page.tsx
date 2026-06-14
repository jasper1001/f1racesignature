import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LiveTimingTower } from '@/components/live/LiveTimingTower'

export const metadata: Metadata = {
  title: 'Live F1 Timing — F1RaceSignature',
  description:
    'Real-time F1 timing tower with live gaps, tyre compounds, pit stops and race control messages powered by OpenF1.',
  alternates: { canonical: '/live' },
}

export default function LivePage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>

        {/* Hero */}
        <div className="relative border-b border-[#0f0f0f] py-14 px-6 text-center overflow-hidden">
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
              background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,0,45,0.08) 0%, transparent 70%)',
            }}
          />
          <p className="relative text-[10px] font-mono uppercase tracking-widest mb-4 text-[#e8002d]">
            Live Timing
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-3"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Timing Tower
          </h1>
          <p className="relative text-white/60 text-sm max-w-sm mx-auto">
            Live positions, gaps, tyre compounds and race control — powered by OpenF1.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div
            className="rounded-2xl bg-[#060606] overflow-hidden p-5 md:p-8"
            style={{
              border: '1px solid rgba(232,0,45,0.25)',
              boxShadow: '0 0 0 1px rgba(232,0,45,0.06), 0 0 40px rgba(232,0,45,0.06)',
            }}
          >
            <LiveTimingTower />
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
