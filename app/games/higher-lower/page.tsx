import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { HigherLowerGame } from '@/components/games/HigherLowerGame'

export const metadata: Metadata = {
  title: 'F1 Higher or Lower Game — Driver Stat Battle | F1RaceSignature',
  description:
    'Does Verstappen have more wins than Hamilton? Compare F1 drivers across wins, poles, podiums and titles. One wrong call ends your streak.',
  keywords: ['F1 higher or lower', 'F1 stats game', 'Formula 1 driver comparison', 'F1 stat battle', 'F1 mini game', 'Formula 1 statistics game'],
  alternates: { canonical: '/games/higher-lower' },
  openGraph: {
    title: 'F1 Higher or Lower — Driver Stat Battle',
    description: 'Does Driver B have more wins than Driver A? Compare F1 stats and build your streak. One wrong answer and it\'s over.',
    url: '/games/higher-lower',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Higher or Lower — Driver Stat Battle on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Higher or Lower — Driver Stat Battle',
    description: 'Does Driver B have more wins than Driver A? Compare F1 stats and build your streak. One wrong answer and it\'s over.',
    images: ['/opengraph-image'],
  },
}

const ACCENT = '#f97316'

export default function HigherLowerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Higher or Lower — Driver Stat Battle',
        description: 'Does Driver B have more career wins than Driver A? Compare F1 stats across wins, poles, podiums, fastest laps, and championships.',
        url: 'https://f1racesignature.site/games/higher-lower',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Higher or Lower' },
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
            className="absolute inset-0 pointer-events-none anim-streaks opacity-60"
            style={{
              backgroundImage: `repeating-linear-gradient(115deg, transparent 0 46px, ${ACCENT}0d 46px 48px, transparent 48px 94px)`,
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
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#f97316] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Stat Battle
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display"
          >
            Higher or Lower
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            Does Driver B have more or fewer stats than Driver A? Build your streak — one wrong answer ends the game.
          </p>
        </div>

        <InlineAffiliateAd placement="game-top" />


        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(249,115,22,0.25)', boxShadow: '0 0 0 1px rgba(249,115,22,0.06), 0 0 40px rgba(249,115,22,0.06)' }}>
            <HigherLowerGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="higher-lower" /></div>
        </div>
        <InlineAffiliateAd placement="game-bottom" />
      </main>
      <Footer />
    </>
  )
}
