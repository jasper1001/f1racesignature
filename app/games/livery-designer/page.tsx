import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InlineAffiliateAd } from '@/components/landing/InlineAffiliateAd'
import { LiveryDesignerGame } from '@/components/games/LiveryDesignerGame'

const ACCENT = '#e0115f'

export const metadata: Metadata = {
  title: 'F1 Livery Designer — Customize Your Own 3D F1 Car | F1RaceSignature',
  description:
    'Design your own Formula 1 car livery in 3D. Paint the bodywork, nose, wings, sidepods and wheels, choose a finish, add your race number and name, then spin the car and share your design.',
  keywords: ['F1 livery designer', 'design your own F1 car', '3D F1 car customizer', 'F1 car paint game', 'Formula 1 livery editor', 'F1 mini game'],
  alternates: { canonical: '/games/livery-designer' },
  openGraph: {
    title: 'F1 Livery Designer — Customize Your Own 3D F1 Car',
    description: 'Paint and style your own F1 car in 3D — bodywork, wings, wheels, finish, number and name. Spin it and share it.',
    url: '/games/livery-designer',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Livery Designer — 3D Car Customizer on F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 Livery Designer — Customize Your Own 3D F1 Car',
    description: 'Paint and style your own F1 car in 3D, then spin it and share your design.',
    images: ['/opengraph-image'],
  },
}

export default function LiveryDesignerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'F1 Livery Designer — Customize Your Own 3D F1 Car',
        description: 'Design your own Formula 1 car livery in 3D: paint the bodywork, wings and wheels, pick a finish, add a number and name, then share it.',
        url: 'https://f1racesignature.site/games/livery-designer',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Mini Games', item: 'https://f1racesignature.site/games' },
            { '@type': 'ListItem', position: 3, name: 'Livery Designer' },
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
            className="relative inline-flex items-center gap-1.5 text-[#1a1712] text-xs font-mono uppercase tracking-widest hover:text-[#e0115f] transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mini Games
          </Link>

          <p className="relative text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>
            Car Design
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-[#1a1712] mb-4"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Livery Designer
          </h1>
          <p className="relative text-[#1a1712] text-sm max-w-md mx-auto leading-relaxed">
            Paint and style your own F1 car in 3D — bodywork, wings, wheels and finish.
            Add your number and name, spin it around, then save and share it.
          </p>
        </div>

        <InlineAffiliateAd placement="game-top" />

        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="rounded-2xl bg-[#fbf9f4] overflow-hidden p-4 md:p-6" style={{ border: '1px solid rgba(224,17,95,0.25)', boxShadow: '0 0 0 1px rgba(224,17,95,0.06), 0 0 40px rgba(224,17,95,0.06)' }}>
            <LiveryDesignerGame />
          </div>
        </div>

        <InlineAffiliateAd placement="game-bottom" />
      </main>
      <Footer />
    </>
  )
}
