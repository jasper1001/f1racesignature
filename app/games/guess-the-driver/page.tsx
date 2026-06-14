import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GuessTheDriverGame } from '@/components/games/GuessTheDriverGame'

export const metadata: Metadata = {
  title: 'Guess the F1 Driver — Trivia Game',
  description:
    'Clues about an F1 driver are revealed one at a time. Guess early for a higher score. 53 drivers across every era of Formula 1 — can you name them all?',
  keywords: ['guess the F1 driver', 'F1 driver quiz', 'Formula 1 trivia', 'F1 knowledge game', 'F1 mini game', 'Formula 1 guessing game'],
  alternates: { canonical: '/games/guess-the-driver' },
  openGraph: {
    title: 'Guess the F1 Driver — Trivia Game',
    description: 'Clues revealed one at a time. Fewer clues used = higher score. 53 Formula 1 drivers from every era.',
    url: '/games/guess-the-driver',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Guess the F1 Driver — Formula 1 Trivia Game on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guess the F1 Driver — Trivia Game',
    description: 'Clues revealed one at a time. Fewer clues used = higher score. 53 Formula 1 drivers from every era.',
    images: ['/opengraph-image'],
  },
}

const ACCENT = '#f59e0b'

export default function GuessTheDriverPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Guess the F1 Driver — Trivia Game',
        description: 'Clues about an F1 driver are revealed one at a time. Guess early for a higher score.',
        url: 'https://f1racesignature.site/games/guess-the-driver',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Guess the F1 Driver' },
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
            className="relative inline-flex items-center gap-1.5 text-white text-xs font-mono uppercase tracking-widest hover:text-[#f59e0b] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            F1 Knowledge
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Guess the Driver
          </h1>
          <p className="relative text-white text-sm max-w-sm mx-auto leading-relaxed">
            Clues are revealed one at a time. Guess early for maximum points.
            53 drivers spanning every era of Formula 1.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="rounded-2xl bg-[#060606] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 0 0 1px rgba(245,158,11,0.06), 0 0 40px rgba(245,158,11,0.06)' }}>
            <GuessTheDriverGame />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
