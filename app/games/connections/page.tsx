import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ConnectionsGame } from '@/components/games/ConnectionsGame'

const ACCENT = '#14b8a6'

export const metadata: Metadata = {
  title: 'F1 Connections Game — Daily Formula 1 Grouping Puzzle | F1RaceSignature',
  description:
    'A daily F1 twist on Connections. Sort 16 tiles into four hidden groups — drivers, teams, circuits and more. Watch the overlaps. New puzzle every day.',
  keywords: ['F1 connections', 'Formula 1 connections game', 'F1 daily puzzle', 'F1 grouping game', 'F1 word game', 'F1 mini game'],
  alternates: { canonical: '/games/connections' },
  openGraph: {
    title: 'F1 Connections Game — Daily Formula 1 Grouping Puzzle',
    description: 'Sort 16 F1 tiles into four hidden groups. A daily Connections puzzle for Formula 1 fans.',
    url: '/games/connections',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Connections — Daily Grouping Puzzle on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Connections Game — Daily Formula 1 Grouping Puzzle',
    description: 'Sort 16 F1 tiles into four hidden groups. A daily Connections puzzle for Formula 1 fans.',
    images: ['/opengraph-image'],
  },
}

export default function ConnectionsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Connections Game — Daily Formula 1 Grouping Puzzle',
        description: 'A daily F1 twist on Connections. Sort 16 tiles into four hidden groups — drivers, teams, circuits and more.',
        url: 'https://f1racesignature.site/games/connections',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Connections' },
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
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#14b8a6] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Daily Puzzle
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            F1 Connections
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-sm mx-auto leading-relaxed">
            Sort sixteen tiles into four hidden groups. Mind the red herrings.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-5 md:p-8" style={{ border: '1px solid rgba(20,184,166,0.25)', boxShadow: '0 0 0 1px rgba(20,184,166,0.06), 0 0 40px rgba(20,184,166,0.06)' }}>
            <ConnectionsGame />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
