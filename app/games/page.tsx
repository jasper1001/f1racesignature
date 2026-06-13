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
      'Watch all five starting lights illuminate one by one. The moment they go dark — tap as fast as you can. Don\'t jump the start.',
    duration: '~30 seconds',
  },
  {
    id: 'guess-the-driver',
    href: '/games/guess-the-driver',
    tag: 'F1 Knowledge',
    title: 'Guess the Driver',
    description:
      'Clues about an F1 driver are revealed one at a time. Identify them early for maximum points. 53 drivers across every era.',
    duration: '~1 minute',
  },
]

export default function GamesPage() {
  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>
        {/* Hero */}
        <div className="border-b border-[#0f0f0f] py-16 px-6 text-center">
          <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-4">
            Mini Games
          </p>
          <h1
            className="text-4xl md:text-5xl text-white mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Test Your F1 Instincts
          </h1>
          <p className="text-[#aaaaaa] max-w-md mx-auto text-sm leading-relaxed">
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
                className="group relative block rounded-2xl border border-[#1a1a1a] bg-[#080808] p-6 hover:border-[#d4a017]/30 hover:bg-[#090907] transition-all duration-300 overflow-hidden"
              >
                {/* Subtle hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(212,160,23,0.04) 0%, transparent 70%)' }}
                />

                {/* Mini lights preview */}
                <div className="flex gap-2.5 mb-6">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border transition-all duration-300"
                      style={{
                        transitionDelay: `${i * 50}ms`,
                        background: '#140505',
                        borderColor: '#250a0a',
                      }}
                    />
                  ))}
                </div>

                <p className="text-[#888888] text-xs font-mono uppercase tracking-widest mb-2">
                  {game.tag}
                </p>
                <h2
                  className="text-2xl text-white mb-3 group-hover:text-[#d4a017] transition-colors duration-200"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  {game.title}
                </h2>
                <p className="text-white text-sm leading-relaxed mb-5">
                  {game.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-[#666666] text-xs font-mono">{game.duration}</span>
                  <span className="inline-flex items-center gap-1.5 text-[#d4a017] text-sm font-medium">
                    Play
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}

            {/* Coming soon */}
            <div className="relative rounded-2xl border border-[#0f0f0f] bg-[#050505] p-6">
              <div className="flex gap-2.5 mb-6">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-[#111111] bg-[#0a0a0a]" />
                ))}
              </div>
              <p className="text-[#222222] text-xs font-mono uppercase tracking-widest mb-2">
                Coming Soon
              </p>
              <h2
                className="text-2xl text-[#222222] mb-3"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
              >
                More Challenges
              </h2>
              <p className="text-[#1a1a1a] text-sm leading-relaxed">
                More F1 mini games are in development.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
