import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { TierListGame } from '@/components/games/TierListGame'
import { GameAbout } from '@/components/games/GameAbout'

const ACCENT = '#f43f5e'

export const metadata: Metadata = {
  title: "F1 Tier List Maker — Rank 'Em S to D | F1RaceSignature",
  description:
    'Drag F1 drivers, teams and circuits into S–D tiers and build your own ranking. Settle the debate, then share your hot takes.',
  keywords: ['F1 tier list', 'F1 tier list maker', 'rank F1 drivers', 'F1 ranking game', 'Formula 1 tier list', 'F1 mini game'],
  alternates: { canonical: '/games/tier-list' },
  openGraph: {
    title: "F1 Tier List Maker — Rank 'Em S to D",
    description: 'Drag F1 drivers, teams and circuits into S–D tiers and share your ranking.',
    url: '/games/tier-list',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: "F1 Tier List Maker — Rank 'Em on F1RaceSignature" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "F1 Tier List Maker — Rank 'Em S to D",
    description: 'Drag F1 drivers, teams and circuits into S–D tiers and share your ranking.',
    images: ['/opengraph-image'],
  },
}

export default function TierListPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: "F1 Tier List Maker — Rank 'Em S to D",
        description: 'Drag F1 drivers, teams and circuits into S–D tiers and build your own ranking.',
        url: 'https://f1racesignature.site/games/tier-list',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: "Rank 'Em" },
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
            style={{ backgroundImage: `repeating-linear-gradient(115deg, transparent 0 46px, ${ACCENT}0d 46px 48px, transparent 48px 94px)` }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${ACCENT}14 0%, transparent 70%)` }}
          />

          <Link
            href="/games"
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#f43f5e] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Hot Takes
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display"
          >
            Rank &apos;Em
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            Drag F1 drivers, teams and circuits into S–D tiers. Build your ranking and settle the debate.
          </p>
        </div>

        <InlineAffiliateAd placement="game-top" />


        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(244,63,94,0.25)', boxShadow: '0 0 0 1px rgba(244,63,94,0.06), 0 0 40px rgba(244,63,94,0.06)' }}>
            <TierListGame />
          </div>
        </div>
        <GameAbout
          title="Build your own F1 tier list"
          accent={ACCENT}
          paragraphs={[
            "Drag drivers, teams and circuits into S-through-D tiers and build the ranking you'd actually defend in an argument. There's no single correct answer here — it's a tool for settling (or starting) the debates every F1 fan has an opinion on.",
            "Rank by era, by current form, by all-time greatness — whatever axis you're arguing. Once it's built, it's yours to save and share, so the ranking becomes something to compare against a friend's rather than just a private list.",
          ]}
        /><InlineAffiliateAd placement="game-bottom" />
      </main>
      <Footer />
    </>
  )
}
