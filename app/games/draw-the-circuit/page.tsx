import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { DrawCircuitGame } from '@/components/games/DrawCircuitGame'

const ACCENT = '#ec4899'

export const metadata: Metadata = {
  title: 'Draw the F1 Circuit Game — Sketch the Track from Memory | F1RaceSignature',
  description:
    'How well do you really know the F1 calendar? Draw a circuit from memory and get scored on how close you got. Easy at Monaco, brutal at Suzuka.',
  keywords: ['draw the F1 circuit', 'F1 track drawing game', 'guess the circuit', 'F1 circuit quiz', 'Formula 1 track game', 'F1 mini game'],
  alternates: { canonical: '/games/draw-the-circuit' },
  openGraph: {
    title: 'Draw the F1 Circuit Game — Sketch the Track from Memory',
    description: 'Draw an F1 circuit from memory and get scored on accuracy against the real layout. Can you nail Suzuka?',
    url: '/games/draw-the-circuit',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Draw the F1 Circuit — Drawing Game on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Draw the F1 Circuit Game — Sketch the Track from Memory',
    description: 'Draw an F1 circuit from memory and get scored on accuracy against the real layout.',
    images: ['/opengraph-image'],
  },
}

export default function DrawCircuitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Draw the F1 Circuit Game — Sketch the Track from Memory',
        description: 'How well do you really know the F1 calendar? Draw a circuit from memory and get scored on how close you got.',
        url: 'https://f1racesignature.site/games/draw-the-circuit',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Draw the Circuit' },
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
            style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${ACCENT}14 0%, transparent 70%)` }}
          />

          <Link
            href="/games"
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#ec4899] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Circuit Art
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Draw the Circuit
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            Sketch an F1 track from memory — then see how close you got to the real layout.
          </p>
        </div>

        <InlineAffiliateAd placement="game-top" />


        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(236,72,153,0.25)', boxShadow: '0 0 0 1px rgba(236,72,153,0.06), 0 0 40px rgba(236,72,153,0.06)' }}>
            <DrawCircuitGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="draw-the-circuit" /></div>
        </div>
        <InlineAffiliateAd placement="game-bottom" />
      </main>
      <Footer />
    </>
  )
}
