import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { TrackBuilderLeaderboards } from '@/components/games/TrackBuilderLeaderboards'
import { TrackBuilderGame } from '@/components/games/TrackBuilderGame'

export const metadata: Metadata = {
  title: 'F1 Track Builder — Circuit Jigsaw Puzzle Game | F1RaceSignature',
  description:
    'Rebuild a scrambled Formula 1 circuit against the clock. Swap the tiles to reassemble the track as fast as you can, then climb the global leaderboard.',
  keywords: ['F1 puzzle game', 'F1 track jigsaw', 'Formula 1 circuit puzzle', 'F1 track builder', 'rebuild F1 track game', 'F1 mini game'],
  alternates: { canonical: '/games/track-builder' },
  openGraph: {
    title: 'F1 Track Builder — Circuit Jigsaw Puzzle',
    description: 'A real F1 circuit, scrambled into tiles. Swap them to rebuild the track as fast as you can.',
    url: '/games/track-builder',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Track Builder — Circuit Jigsaw Puzzle on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Track Builder — Circuit Jigsaw Puzzle',
    description: 'A real F1 circuit, scrambled into tiles. Swap them to rebuild the track as fast as you can.',
    images: ['/opengraph-image'],
  },
}

export default function TrackBuilderPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Track Builder — Circuit Jigsaw Puzzle',
        description: 'Rebuild a scrambled Formula 1 circuit against the clock by swapping tiles. Fastest build wins.',
        url: 'https://f1racesignature.site/games/track-builder',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Track Builder' },
          ],
        },
      }) }} />
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#f4f1ea' }}>

        {/* Hero */}
        <div className="relative border-b border-[#dcd5c6] py-16 px-6 text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.045) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(132,204,22,0.08) 0%, transparent 70%)',
            }}
          />
          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#84cc16' }}>
            Circuit Puzzle
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Track Builder
          </h1>
          <p className="relative text-[#6b6358] text-sm max-w-sm mx-auto">
            A real F1 circuit, scrambled into tiles. Rebuild it as fast as you can.
          </p>
        </div>

        {/* Game */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-1 md:p-2" style={{ border: '1px solid rgba(132,204,22,0.25)', boxShadow: '0 0 0 1px rgba(132,204,22,0.06), 0 0 40px rgba(132,204,22,0.06)' }}>
            <TrackBuilderGame />
          </div>
          <div className="mt-6"><TrackBuilderLeaderboards /></div>
        </div>

      </main>
      <Footer />
    </>
  )
}
