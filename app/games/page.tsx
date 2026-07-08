import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GAMES } from '@/lib/games/registry'
import { LeaderboardsHub } from '@/components/games/LeaderboardsHub'

export const metadata: Metadata = {
  title: 'F1 Mini Games — Reaction Tests, Trivia & Circuit Puzzles',
  description:
    'Free Formula 1 mini games: rebuild a circuit in the Track Builder puzzle, beat the lights-out reaction test, nail the pit-stop timer, guess the driver Wordle-style, identify track outlines, and more. No sign-up needed.',
  keywords: [
    'F1 mini games', 'F1 puzzle game', 'F1 track builder', 'Formula 1 reaction test',
    'F1 lights out game', 'F1 Wordle', 'pit stop timer game', 'F1 trivia game',
    'guess the F1 driver', 'F1 track quiz', 'F1 championship game', 'Formula 1 game free',
  ],
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'F1 Mini Games — Reaction Tests, Trivia & Circuit Puzzles',
    description: 'Free F1 mini games: the Track Builder circuit puzzle, lights-out reaction test, pit-stop timer, driver Wordle, track quiz and more.',
    url: '/games',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Mini Games — F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Mini Games — Reaction Tests, Trivia & Circuit Puzzles',
    description: 'Free F1 mini games to test your reflexes, knowledge, and racing instincts — including the new Track Builder circuit puzzle.',
    images: ['/opengraph-image'],
  },
}

const gamesJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
        { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
      ],
    },
    {
      '@type': 'ItemList',
      name: 'F1 Mini Games',
      description: 'Free Formula 1 mini games — reaction tests, trivia, driver puzzles and more.',
      url: 'https://f1racesignature.site/games',
      numberOfItems: GAMES.length,
      itemListElement: GAMES.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: g.title,
        description: g.description,
        url: `https://f1racesignature.site${g.href}`,
      })),
    },
  ],
}

export default function GamesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(gamesJsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#f4f1ea' }}>

        {/* Hero */}
        <div className="relative border-b border-[#dcd5c6] py-20 px-6 text-center overflow-hidden">
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.045) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Drifting diagonal speed streaks */}
          <div
            className="absolute inset-0 pointer-events-none anim-streaks opacity-60"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, transparent 0 46px, rgba(212,160,23,0.05) 46px 48px, transparent 48px 94px)',
            }}
          />
          {/* Gold top glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 70%)',
            }}
          />
          <p className="relative text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-4">
            🏁 Mini Games
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4 font-display"
          >
            Test Your F1 Instincts
          </h1>
          <p className="relative text-[#1a1712] max-w-md mx-auto text-sm leading-relaxed">
            Lightweight F1-themed challenges you can complete in under two minutes.
            Best scores saved automatically.
          </p>

          {/* Fun stats strip */}
          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] font-mono uppercase tracking-widest text-[#7a7264]">
            {[
              `${GAMES.length} games`,
              'Free to play',
              'No sign-up',
              'Scores saved',
            ].map((stat, i) => (
              <span key={stat} className="inline-flex items-center gap-3">
                {i > 0 && <span className="text-[#d4a017]/50">•</span>}
                {stat}
              </span>
            ))}
          </div>
        </div>

        {/* Games grid */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GAMES.map((game, i) => (
              <Link
                key={game.id}
                href={game.href}
                className="group relative block rounded-2xl border border-[#dcd5c6] bg-[#fbf9f4] p-6 transition-all duration-300 overflow-hidden hover:border-[#c4bca8] hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Left accent stripe — widens on hover */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-all duration-300 group-hover:w-1.5"
                  style={{ background: game.accent }}
                />

                {/* Hover glow from left */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 75% 65% at 0% 50%, ${game.accent}16 0%, transparent 65%)`,
                  }}
                />

                {/* Engagement badge */}
                {game.badge && (
                  <span
                    className="anim-badge-pulse absolute top-5 right-5 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-semibold"
                    style={{
                      color: game.accent,
                      background: `${game.accent}14`,
                      border: `1px solid ${game.accent}33`,
                    }}
                  >
                    {game.badge}
                  </span>
                )}

                {/* Game icon — gently floats, pops on hover */}
                <div className="mb-5">
                  <span
                    className="anim-float inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                    style={{
                      background: `${game.accent}15`,
                      border: `1px solid ${game.accent}25`,
                      animationDelay: `${(i % 6) * 0.4}s`,
                    }}
                  >
                    {game.icon}
                  </span>
                </div>

                {/* Tag */}
                <p
                  className="text-xs font-mono uppercase tracking-widest mb-2 font-semibold"
                  style={{ color: game.accent }}
                >
                  {game.tag}
                </p>

                {/* Title */}
                <h2
                  className="text-2xl text-[#1a1712] mb-3 transition-colors duration-200 font-display"
                >
                  {game.title}
                </h2>

                <p className="text-[#1a1712] text-sm leading-relaxed mb-5">{game.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-[#1a1712] text-xs font-mono">{game.duration}</span>
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: game.accent }}
                  >
                    Play
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}

            {/* Coming soon */}
            <div className="relative rounded-2xl border border-dashed border-[#d0c8b6] bg-[#efe9dd] p-6 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-[#d0c8b6]" />
              <div className="mb-5">
                <div className="w-12 h-12 rounded-xl border border-[#d8d2c4] bg-[#f4f1ea] flex items-center justify-center">
                  <span className="text-[#a89f8c] text-xl">?</span>
                </div>
              </div>
              <p className="text-[#a89f8c] text-xs font-mono uppercase tracking-widest mb-2">Coming Soon</p>
              <h2
                className="text-2xl text-[#a89f8c] mb-3 font-display"
              >
                More Challenges
              </h2>
              <p className="text-[#b3aa97] text-sm leading-relaxed">More F1 mini games are in development.</p>
            </div>
          </div>
        </div>

        <LeaderboardsHub />
      </main>
      <Footer />
    </>
  )
}
