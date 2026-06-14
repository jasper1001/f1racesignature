import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TrackOutlineGame } from '@/components/games/TrackOutlineGame'

export const metadata: Metadata = {
  title: 'F1 Track Outline Quiz — Name the Circuit',
  description:
    'Can you identify an F1 circuit from its silhouette alone? No name, no location — just the shape. 10 rounds across 12 iconic Formula 1 tracks.',
  keywords: ['F1 track quiz', 'Formula 1 circuit quiz', 'track outline game', 'F1 circuit identification', 'F1 mini game', 'Formula 1 tracks game'],
  alternates: { canonical: '/games/track-outline' },
  openGraph: {
    title: 'F1 Track Outline Quiz — Name the Circuit',
    description: 'Identify F1 circuits from their silhouette alone. No labels, no clues — just the shape. 12 iconic Formula 1 tracks.',
    url: '/games/track-outline',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Track Outline Quiz — Identify Formula 1 Circuits on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Track Outline Quiz — Name the Circuit',
    description: 'Identify F1 circuits from their silhouette alone. No labels, no clues — just the shape.',
    images: ['/opengraph-image'],
  },
}

const ACCENT = '#a855f7'

export default function TrackOutlinePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Track Outline Quiz — Name the Circuit',
        description: 'Can you identify an F1 circuit from its silhouette alone? No name, no location — just the shape.',
        url: 'https://f1racesignature.site/games/track-outline',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Track Outline Quiz' },
          ],
        },
      }) }} />
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
          <div className="rounded-2xl bg-[#060606] overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.25)', boxShadow: '0 0 0 1px rgba(168,85,247,0.06), 0 0 40px rgba(168,85,247,0.06)' }}>
            <TrackOutlineGame />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
