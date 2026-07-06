import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { PitStopTimerGame } from '@/components/games/PitStopTimerGame'

export const metadata: Metadata = {
  title: 'F1 Pit Stop Timer Game — Test Your Reaction Speed | F1RaceSignature',
  description:
    'How fast are your reactions? Time your pit stop release like an F1 crew chief. Beat the benchmark.',
  keywords: ['F1 pit stop game', 'pit wall timer', 'Formula 1 pit stop', 'F1 precision game', 'F1 mini game', 'pit stop timer game'],
  alternates: { canonical: '/games/pit-stop-timer' },
  openGraph: {
    title: 'F1 Pit Stop Timer — Pit Wall Game',
    description: 'Can you release the car at the perfect moment? Too early is unsafe. Too late loses positions. Three difficulty modes.',
    url: '/games/pit-stop-timer',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Pit Stop Timer — Pit Wall Precision Game on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Pit Stop Timer — Pit Wall Game',
    description: 'Can you release the car at the perfect moment? Too early is unsafe. Too late loses positions. Three difficulty modes.',
    images: ['/opengraph-image'],
  },
}

export default function PitStopTimerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Pit Stop Timer — Pit Wall Game',
        description: 'A target stop time is shown — can you release the car at the perfect moment? Too early is unsafe. Too late loses positions.',
        url: 'https://f1racesignature.site/games/pit-stop-timer',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Pit Stop Timer' },
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
              background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 70%)',
            }}
          />
          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#06b6d4' }}>
            Pit Wall
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display"
          >
            Pit Stop Timer
          </h1>
          <p className="relative text-[#6b6358] text-sm max-w-sm mx-auto">
            Can you release the car at the perfect moment?
          </p>
        </div>

        {/* Game */}
        <InlineAffiliateAd placement="game-top" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(6,182,212,0.25)', boxShadow: '0 0 0 1px rgba(6,182,212,0.06), 0 0 40px rgba(6,182,212,0.06)' }}>
            <PitStopTimerGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="pit-stop-timer" /></div>
        </div>

        <InlineAffiliateAd placement="game-bottom" />

      </main>
      <Footer />
    </>
  )
}
