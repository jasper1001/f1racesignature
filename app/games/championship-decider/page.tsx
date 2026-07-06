import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { ChampionshipDeciderGame } from '@/components/games/ChampionshipDeciderGame'

export const metadata: Metadata = {
  title: 'F1 Championship Decider Game — Pit Wall Strategy Quiz | F1RaceSignature',
  description:
    'Relive real F1 title-deciding moments — Abu Dhabi 2021, Monaco 2016, Turkey 2020 — and make the call from the pit wall. Would you have lifted the trophy?',
  keywords: ['F1 strategy game', 'championship decider', 'pit wall strategy quiz', 'F1 decision game', 'Formula 1 strategy', 'F1 mini game'],
  alternates: { canonical: '/games/championship-decider' },
  openGraph: {
    title: 'F1 Championship Decider — Pit Wall Strategy Quiz',
    description: 'Real F1 strategy scenarios — Abu Dhabi 2021, Monaco 2016, Turkey 2020. You decide from the pit wall.',
    url: '/games/championship-decider',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Championship Decider — Strategy Quiz on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Championship Decider — Pit Wall Strategy Quiz',
    description: 'Real F1 strategy scenarios — Abu Dhabi 2021, Monaco 2016, Turkey 2020. You decide from the pit wall.',
    images: ['/opengraph-image'],
  },
}

const ACCENT = '#3b82f6'

export default function ChampionshipDeciderPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Championship Decider — Strategy Quiz',
        description: 'Relive real F1 strategy moments from the pit wall. Abu Dhabi 2021, Monaco 2016, Turkey 2020. Would you have made the right call?',
        url: 'https://f1racesignature.site/games/championship-decider',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Championship Decider' },
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
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#3b82f6] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            F1 Strategy
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display"
          >
            Championship Decider
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            Relive real F1 strategy moments and decide what you would do from the pit wall.
            Would you survive as an F1 strategist?
          </p>
        </div>

        <InlineAffiliateAd placement="game-top" />


        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 0 1px rgba(59,130,246,0.06), 0 0 40px rgba(59,130,246,0.06)' }}>
            <ChampionshipDeciderGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="championship-decider" /></div>
        </div>
        <InlineAffiliateAd placement="game-bottom" />
      </main>
      <Footer />
    </>
  )
}
