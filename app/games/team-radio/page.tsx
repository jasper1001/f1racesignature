import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { TeamRadioGame } from '@/components/games/TeamRadioGame'
import { RADIO_QUOTES } from '@/lib/games/teamRadioData'

export const metadata: Metadata = {
  title: 'F1 Team Radio Quiz — Who Said It?',
  description:
    `Famous transmissions from the pit wall — can you name the driver from their team radio? ${RADIO_QUOTES.length} iconic F1 radio moments spanning every era of Formula 1.`,
  keywords: ['F1 team radio quiz', 'guess the driver radio', 'Formula 1 radio quotes', 'F1 radio game', 'F1 mini game', 'Formula 1 team radio'],
  alternates: { canonical: '/games/team-radio' },
  openGraph: {
    title: 'F1 Team Radio Quiz — Who Said It?',
    description: `Famous pit wall transmissions — can you name the driver? ${RADIO_QUOTES.length} iconic F1 radio moments from every era.`,
    url: '/games/team-radio',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Team Radio Quiz — Guess the Driver on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Team Radio Quiz — Who Said It?',
    description: `Famous pit wall transmissions — can you name the driver? ${RADIO_QUOTES.length} iconic F1 radio moments from every era.`,
    images: ['/opengraph-image'],
  },
}

const ACCENT = '#10b981'

export default function TeamRadioPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Team Radio Quiz — Who Said It?',
        description: `Famous transmissions from the pit wall — can you name the driver from their team radio? ${RADIO_QUOTES.length} iconic F1 radio moments.`,
        url: 'https://f1racesignature.site/games/team-radio',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Team Radio Guess' },
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
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#10b981] transition-colors mb-6"
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
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display"
          >
            Team Radio Guess
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            Famous quotes from the pit wall. Who said it on the radio?
          </p>
        </div>

        <InlineAffiliateAd placement="game-top" />


        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 0 1px rgba(16,185,129,0.06), 0 0 40px rgba(16,185,129,0.06)' }}>
            <TeamRadioGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="team-radio" /></div>
        </div>
        <InlineAffiliateAd placement="game-bottom" />
      </main>
      <Footer />
    </>
  )
}
