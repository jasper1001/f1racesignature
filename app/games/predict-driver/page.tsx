import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { PredictDriverGame } from '@/components/games/PredictDriverGame'

export const metadata: Metadata = {
  title: 'Predict the Driver — F1 Wordle Game',
  description:
    'Wordle meets Formula 1. Identify the mystery F1 driver in 6 guesses using nationality, wins, poles, debut year, and team hints. Daily and Endless modes.',
  keywords: ['F1 Wordle', 'predict the driver', 'F1 driver puzzle', 'Formula 1 daily game', 'F1 guessing game', 'F1 mini game'],
  alternates: { canonical: '/games/predict-driver' },
  openGraph: {
    title: 'Predict the Driver — F1 Wordle Game',
    description: 'Wordle meets F1. Identify the mystery driver in 6 guesses using nationality, wins, poles, debut year and team hints.',
    url: '/games/predict-driver',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Predict the Driver — F1 Wordle Game on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Predict the Driver — F1 Wordle Game',
    description: 'Wordle meets F1. Identify the mystery driver in 6 guesses using nationality, wins, poles, debut year and team hints.',
    images: ['/opengraph-image'],
  },
}

const ACCENT = '#6366f1'

export default function PredictDriverPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Predict the Driver — F1 Wordle Game',
        description: 'Wordle meets Formula 1. Identify the mystery F1 driver in 6 guesses using nationality, wins, poles, debut year, and team hints.',
        url: 'https://f1racesignature.site/games/predict-driver',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Predict the Driver' },
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
              background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${ACCENT}14 0%, transparent 70%)`,
            }}
          />

          <Link
            href="/games"
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#6366f1] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            F1 Wordle
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display"
          >
            Predict the Driver
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            Can you identify the mystery F1 driver in 6 guesses?
          </p>
        </div>

        <InlineAffiliateAd placement="game-top" />


        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 0 0 1px rgba(99,102,241,0.06), 0 0 40px rgba(99,102,241,0.06)' }}>
            <PredictDriverGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="predict-driver" /></div>
        </div>
        <InlineAffiliateAd placement="game-bottom" />
      </main>
      <Footer />
    </>
  )
}
