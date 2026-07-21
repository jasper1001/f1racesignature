import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { GameAbout } from '@/components/games/GameAbout'
import { PodiumScrambleGame } from '@/components/games/PodiumScrambleGame'

export const metadata: Metadata = {
  title: 'Podium Scramble — Order the F1 Rostrum | F1RaceSignature',
  description:
    'A famous F1 race, its podium scrambled. Reorder the three drivers into the correct finishing order — P1, P2, P3. Six races, fewest positions off wins. Climb the global leaderboard.',
  keywords: ['F1 podium game', 'order the podium', 'F1 results quiz', 'guess the finishing order', 'Formula 1 mini game', 'F1 history game'],
  alternates: { canonical: '/games/podium-scramble' },
  openGraph: {
    title: 'Podium Scramble — Order the F1 Rostrum',
    description: 'A famous F1 podium, scrambled. Can you put P1, P2 and P3 back in order?',
    url: '/games/podium-scramble',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Podium Scramble — order the F1 rostrum on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podium Scramble — Order the F1 Rostrum',
    description: 'A famous F1 podium, scrambled. Can you put P1, P2 and P3 back in order?',
    images: ['/opengraph-image'],
  },
}

export default function PodiumScramblePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Podium Scramble — Order the F1 Rostrum',
        description: 'Reorder a scrambled F1 podium into the correct finishing order. Fewest positions off across six races wins.',
        url: 'https://f1racesignature.site/games/podium-scramble',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Podium Scramble' },
          ],
        },
      }) }} />
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#f4f1ea' }}>

        {/* Hero */}
        <div className="relative border-b border-[#dcd5c6] py-16 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.045) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute inset-0 pointer-events-none anim-streaks opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 46px, rgba(212,160,23,0.05) 46px 48px, transparent 48px 94px)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(212,160,23,0.10) 0%, transparent 70%)' }} />
          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#d4a017' }}>
            Race Results
          </p>
          <h1 className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display">
            Podium Scramble
          </h1>
          <p className="relative text-[#6b6358] text-sm max-w-sm mx-auto">
            A famous podium, shuffled. Put P1, P2 and P3 back in order.
          </p>
        </div>

        {/* Game */}
        <InlineAffiliateAd placement="game-top" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(212,160,23,0.30)', boxShadow: '0 0 0 1px rgba(212,160,23,0.06), 0 0 40px rgba(212,160,23,0.06)' }}>
            <PodiumScrambleGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="podium-scramble" /></div>
        </div>
        <GameAbout
          title="Reorder a scrambled F1 podium"
          accent="#d4a017"
          paragraphs={[
            "The three drivers who finished on the rostrum in a famous race, presented out of order — your job is to put them back into P1, P2, P3. Six races per round, scored by how many positions off you land in total.",
            "Some podiums are locked into F1 memory and go quickly. Others depend on remembering a specific race's late drama — a safety car that reshuffled positions, a penalty applied after the flag — rather than just who the fastest driver that weekend generally was.",
          ]}
        />

        <InlineAffiliateAd placement="game-bottom" />

      </main>
      <Footer />
    </>
  )
}
