import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Mini Games',
  description: 'F1-themed mini games to test your reflexes, knowledge, and racing instincts. Free to play.',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'Mini Games | F1RaceSignature',
    description: 'F1-themed mini games — test your reflexes like a real driver.',
    url: '/games',
    type: 'website',
  },
}

const GAMES = [
  {
    id: 'lights-out',
    href: '/games/lights-out',
    tag: 'Reaction Test',
    title: 'Lights Out',
    description:
      "Watch all five starting lights illuminate one by one. The moment they go dark — tap as fast as you can. Don't jump the start.",
    duration: '~30 seconds',
    accent: '#ef4444',
    icon: '🚦',
  },
  {
    id: 'guess-the-driver',
    href: '/games/guess-the-driver',
    tag: 'F1 Knowledge',
    title: 'Guess the Driver',
    description:
      'Clues about an F1 driver are revealed one at a time. Identify them early for maximum points. 53 drivers across every era.',
    duration: '~1 minute',
    accent: '#f59e0b',
    icon: '🏎️',
  },
  {
    id: 'track-outline',
    href: '/games/track-outline',
    tag: 'Circuit Knowledge',
    title: 'Track Outline Quiz',
    description:
      'A circuit silhouette is shown — no name, no labels. Pick the correct track from four options across 10 rounds.',
    duration: '~2 minutes',
    accent: '#a855f7',
    icon: '🗺️',
  },
  {
    id: 'championship-decider',
    href: '/games/championship-decider',
    tag: 'F1 Strategy',
    title: 'Championship Decider',
    description:
      'Relive real F1 strategy moments and decide what you would do from the pit wall. Abu Dhabi 2021. Monaco 2016. Turkey 2020.',
    duration: '~10 minutes',
    accent: '#3b82f6',
    icon: '🏆',
  },
  {
    id: 'team-radio',
    href: '/games/team-radio',
    tag: 'F1 Knowledge',
    title: 'Team Radio Guess',
    description:
      'Famous quotes from the pit wall. A transmission plays — you pick the driver. 30 legendary radio moments across every era.',
    duration: '~3 minutes',
    accent: '#10b981',
    icon: '📻',
  },
  {
    id: 'predict-driver',
    href: '/games/predict-driver',
    tag: 'F1 Wordle',
    title: 'Predict the Driver',
    description:
      'Wordle for F1. Identify the mystery driver in 6 guesses using nationality, wins, poles, debut year, and team hints. Daily + Endless modes.',
    duration: '~2 minutes',
    accent: '#6366f1',
    icon: '🎯',
  },
  {
    id: 'higher-lower',
    href: '/games/higher-lower',
    tag: 'Stat Battle',
    title: 'Higher or Lower',
    description:
      'Does Driver B have more career wins than Driver A? Compare stats across wins, poles, podiums, fastest laps, championships and race starts. Build your streak.',
    duration: 'Endless',
    accent: '#f97316',
    icon: '⚡',
  },
]

export default function GamesPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>

        {/* Hero */}
        <div className="relative border-b border-[#0f0f0f] py-20 px-6 text-center overflow-hidden">
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
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
            Mini Games
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Test Your F1 Instincts
          </h1>
          <p className="relative text-white max-w-md mx-auto text-sm leading-relaxed">
            Lightweight F1-themed challenges you can complete in under two minutes.
            Best scores saved automatically.
          </p>
        </div>

        {/* Games grid */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {GAMES.map((game) => (
              <Link
                key={game.id}
                href={game.href}
                className="group relative block rounded-2xl border border-[#1a1a1a] bg-[#080808] p-6 transition-all duration-300 overflow-hidden hover:border-[#252525] hover:-translate-y-0.5 hover:shadow-2xl"
              >
                {/* Left accent stripe */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-opacity duration-300"
                  style={{ background: game.accent }}
                />

                {/* Hover glow from left */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 75% 65% at 0% 50%, ${game.accent}16 0%, transparent 65%)`,
                  }}
                />

                {/* Game icon */}
                <div className="mb-5">
                  <span
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl"
                    style={{ background: `${game.accent}15`, border: `1px solid ${game.accent}25` }}
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
                  className="text-2xl text-white mb-3 transition-colors duration-200"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  {game.title}
                </h2>

                <p className="text-white text-sm leading-relaxed mb-5">{game.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-mono">{game.duration}</span>
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
            <div className="relative rounded-2xl border border-[#0f0f0f] bg-[#050505] p-6 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-[#1a1a1a]" />
              <div className="mb-5">
                <div className="w-12 h-12 rounded-xl border border-[#111111] bg-[#080808] flex items-center justify-center">
                  <span className="text-[#222222] text-xl">?</span>
                </div>
              </div>
              <p className="text-[#222222] text-xs font-mono uppercase tracking-widest mb-2">Coming Soon</p>
              <h2
                className="text-2xl text-[#222222] mb-3"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                More Challenges
              </h2>
              <p className="text-[#1a1a1a] text-sm leading-relaxed">More F1 mini games are in development.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
