import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { NameThatLapGame } from '@/components/games/NameThatLapGame'

export const metadata: Metadata = {
  title: 'Name That Lap — Guess the F1 Circuit from its Racing Line | F1RaceSignature',
  description:
    'A real F1 lap is drawn out as a racing line with no labels. Read the shape and name the circuit from four options. Ten laps, then climb the global leaderboard.',
  keywords: ['F1 racing line quiz', 'guess the F1 circuit', 'F1 telemetry game', 'name that lap', 'F1 track quiz', 'F1 mini game'],
  alternates: { canonical: '/games/name-that-lap' },
  openGraph: {
    title: 'Name That Lap — Guess the F1 Circuit from its Racing Line',
    description: 'A real F1 lap, drawn as a racing line with no labels. Can you name the circuit from its shape?',
    url: '/games/name-that-lap',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Name That Lap — F1 racing-line quiz on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Name That Lap — Guess the F1 Circuit from its Racing Line',
    description: 'A real F1 lap, drawn as a racing line with no labels. Can you name the circuit from its shape?',
    images: ['/opengraph-image'],
  },
}

export default function NameThatLapPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Name That Lap — Guess the F1 Circuit from its Racing Line',
        description: 'A real F1 lap is drawn out as a racing line with no labels. Name the circuit from four options.',
        url: 'https://f1racesignature.site/games/name-that-lap',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Name That Lap' },
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
              background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)',
            }}
          />
          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#8b5cf6' }}>
            Telemetry Quiz
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Name That Lap
          </h1>
          <p className="relative text-[#6b6358] text-sm max-w-sm mx-auto">
            A real F1 racing line, drawn with no labels. Can you name the circuit?
          </p>
        </div>

        {/* Game */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 0 1px rgba(139,92,246,0.06), 0 0 40px rgba(139,92,246,0.06)' }}>
            <NameThatLapGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="name-that-lap" /></div>
        </div>

      </main>
      <Footer />
    </>
  )
}
