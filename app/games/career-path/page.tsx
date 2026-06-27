import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { LeaderboardView } from '@/components/games/LeaderboardView'
import { CareerPathGame } from '@/components/games/CareerPathGame'

const ACCENT = '#0ea5e9'

export const metadata: Metadata = {
  title: 'F1 Career Path Game — Guess the Driver from Their Teams | F1RaceSignature',
  description:
    'Toro Rosso, Red Bull, Aston Martin… Name the F1 driver from the teams they raced for. Guess on fewer teams for a higher score.',
  keywords: ['F1 career path', 'guess the F1 driver', 'F1 teams quiz', 'F1 driver teams game', 'Formula 1 trivia', 'F1 mini game'],
  alternates: { canonical: '/games/career-path' },
  openGraph: {
    title: 'F1 Career Path Game — Guess the Driver from Their Teams',
    description: 'Name the F1 driver from the teams they raced for. The fewer teams you need, the higher your score.',
    url: '/games/career-path',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Career Path — Guess the Driver on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Career Path Game — Guess the Driver from Their Teams',
    description: 'Name the F1 driver from the teams they raced for. The fewer teams you need, the higher your score.',
    images: ['/opengraph-image'],
  },
}

export default function CareerPathPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Career Path Game — Guess the Driver from Their Teams',
        description: 'Name the F1 driver from the teams they raced for, revealed one at a time.',
        url: 'https://f1racesignature.site/games/career-path',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Career Path' },
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
            style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${ACCENT}14 0%, transparent 70%)` }}
          />

          <Link
            href="/games"
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#0ea5e9] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Guess the Driver
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Career Path
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            A driver&apos;s teams, revealed one at a time. Name them on the fewest teams you can.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(14,165,233,0.25)', boxShadow: '0 0 0 1px rgba(14,165,233,0.06), 0 0 40px rgba(14,165,233,0.06)' }}>
            <CareerPathGame />
          </div>
          <div className="mt-6"><LeaderboardView gameId="career-path" /></div>
        </div>
      </main>
      <Footer />
    </>
  )
}
