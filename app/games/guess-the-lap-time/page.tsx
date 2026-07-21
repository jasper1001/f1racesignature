import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { GameAbout } from '@/components/games/GameAbout'
import { GuessLapTimeGame } from '@/components/games/GuessLapTimeGame'

export const metadata: Metadata = {
  title: 'Guess the Lap Time — How Fast Was That F1 Lap? | F1RaceSignature',
  description:
    'See a real F1 lap — circuit, driver and year — and guess its lap time on a slider. The closer you are, the lower your score. Five laps, then climb the global leaderboard.',
  keywords: ['F1 lap time game', 'guess the lap time', 'F1 telemetry game', 'F1 pace quiz', 'Formula 1 mini game', 'how fast F1 lap'],
  alternates: { canonical: '/games/guess-the-lap-time' },
  openGraph: {
    title: 'Guess the Lap Time — How Fast Was That F1 Lap?',
    description: 'A real F1 lap, drawn as a racing line. Slide to guess its lap time — how close can you get?',
    url: '/games/guess-the-lap-time',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Guess the Lap Time — F1 pace quiz on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guess the Lap Time — How Fast Was That F1 Lap?',
    description: 'A real F1 lap, drawn as a racing line. Slide to guess its lap time — how close can you get?',
    images: ['/opengraph-image'],
  },
}

export default function GuessLapTimePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Guess the Lap Time — How Fast Was That F1 Lap?',
        description: 'See a real F1 lap and guess its lap time on a slider. Closest total across five laps wins.',
        url: 'https://f1racesignature.site/games/guess-the-lap-time',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Guess the Lap Time' },
          ],
        },
      }) }} />
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#f4f1ea' }}>

        {/* Hero */}
        <div className="relative border-b border-[#dcd5c6] py-16 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.045) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute inset-0 pointer-events-none anim-streaks opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 46px, rgba(225,29,72,0.05) 46px 48px, transparent 48px 94px)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(225,29,72,0.08) 0%, transparent 70%)' }} />
          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#e11d48' }}>
            Time Trial
          </p>
          <h1 className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display">
            Guess the Lap Time
          </h1>
          <p className="relative text-[#6b6358] text-sm max-w-sm mx-auto">
            See a real F1 lap. How fast do you think it was?
          </p>
        </div>

        {/* Game */}
        <InlineAffiliateAd placement="game-top" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(225,29,72,0.25)', boxShadow: '0 0 0 1px rgba(225,29,72,0.06), 0 0 40px rgba(225,29,72,0.06)' }}>
            <GuessLapTimeGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="guess-the-lap-time" /></div>
        </div>
        <GameAbout
          title="Guess a real F1 lap time on a slider"
          accent="#e11d48"
          paragraphs={[
            "Every lap in this game is real — a specific driver, circuit and year, pulled from actual F1 telemetry. You see the context but not the number, and have to slide to your best guess of the lap time. The closer you land, the lower your score for that lap.",
            "It's a genuinely useful gut-check for how well-calibrated your sense of F1 pace really is — the gap between a Monaco lap and a Monza lap is enormous, and a circuit you don't watch often can throw off even a confident guess by several seconds.",
          ]}
        />

        <InlineAffiliateAd placement="game-bottom" />

      </main>
      <Footer />
    </>
  )
}
