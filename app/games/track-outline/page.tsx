import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TrackOutlineGame } from '@/components/games/TrackOutlineGame'

export const metadata: Metadata = {
  title: 'Track Outline Quiz',
  description: 'Can you identify the F1 circuit from its silhouette alone? Test your knowledge across 12 iconic Formula 1 tracks.',
  alternates: { canonical: '/games/track-outline' },
  openGraph: {
    title: 'Track Outline Quiz | F1RaceSignature',
    description: 'Identify F1 circuits from their silhouettes. No labels, no clues.',
    url: '/games/track-outline',
    type: 'website',
  },
}

const ACCENT = '#a855f7'

export default function TrackOutlinePage() {
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
            className="relative inline-flex items-center gap-1.5 text-white text-xs font-mono uppercase tracking-widest hover:text-[#a855f7] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Circuit Knowledge
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Track Outline Quiz
          </h1>
          <p className="relative text-white text-sm max-w-sm mx-auto leading-relaxed">
            A circuit silhouette is shown — no name, no location.
            Identify it from four options. 12 iconic F1 circuits.
          </p>
        </div>

        <div className="max-w-lg mx-auto px-6 py-12">
          <TrackOutlineGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
