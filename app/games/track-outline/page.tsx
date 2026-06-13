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

export default function TrackOutlinePage() {
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
              Circuit Knowledge
            </p>
            <h1
              className="text-4xl md:text-5xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Track Outline Quiz
            </h1>
            <p className="text-white text-sm max-w-sm mx-auto leading-relaxed">
              A circuit silhouette is shown — no name, no location.
              Identify it from four options. 12 iconic F1 circuits.
            </p>
          </div>

          <TrackOutlineGame />
        </div>
      </main>
      <Footer />
    </>
  )
}
