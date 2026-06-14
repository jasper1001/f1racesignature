import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LiveTimingTower } from '@/components/live/LiveTimingTower'
import { TrackMap } from '@/components/live/TrackMap'

export const metadata: Metadata = {
  title: 'F1 Live Timing — Track Map, Gaps & Tyre Compounds',
  description:
    'Real-time Formula 1 timing tower with live car positions on the track map, inter-car gaps, tyre compounds, pit stops, and race control messages — powered by OpenF1.',
  keywords: [
    'F1 live timing', 'Formula 1 live tracker', 'F1 race live', 'F1 track map live',
    'F1 car positions', 'F1 tyre compounds live', 'F1 gaps live', 'F1 pit stop tracker',
    'F1 race control messages', 'live Formula 1 data', 'OpenF1 live timing',
  ],
  alternates: { canonical: '/live' },
  openGraph: {
    title: 'F1 Live Timing — Track Map, Gaps & Tyre Compounds',
    description: 'Live car positions, inter-car gaps, tyre compounds, pit stops, and race control messages for every F1 session.',
    url: '/live',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Live Timing — F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Live Timing — Track Map, Gaps & Tyre Compounds',
    description: 'Live F1 car positions on the track map plus timing tower with gaps, tyres and pit data.',
    images: ['/opengraph-image'],
  },
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

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col xl:flex-row xl:items-start gap-6">

            {/* Track map — fills remaining width on desktop */}
            <div
              className="xl:flex-1 xl:min-w-0 rounded-2xl bg-[#060606] overflow-hidden p-5 md:p-8"
              style={{
                border: '1px solid rgba(67,176,42,0.2)',
                boxShadow: '0 0 0 1px rgba(67,176,42,0.05), 0 0 40px rgba(67,176,42,0.05)',
              }}
            >
              <TrackMap />
            </div>

            {/* Timing tower — fixed 640px on desktop, full width on mobile */}
            <div
              className="xl:w-[640px] xl:shrink-0 rounded-2xl bg-[#060606] overflow-hidden p-5 md:p-8"
              style={{
                border: '1px solid rgba(232,0,45,0.25)',
                boxShadow: '0 0 0 1px rgba(232,0,45,0.06), 0 0 40px rgba(232,0,45,0.06)',
              }}
            >
              <LiveTimingTower />
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
