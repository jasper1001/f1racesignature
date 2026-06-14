import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScheduleView } from '@/components/schedule/ScheduleView'
import { getSchedule } from '@/lib/f1api'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'F1 2026 Race Schedule — All Session Times by Timezone',
  description:
    'Full 2026 Formula 1 race calendar with every session time — Practice, Qualifying, Sprint and Race — displayed in your local timezone. Never miss a session.',
  keywords: [
    'F1 2026 schedule', 'Formula 1 calendar 2026', 'F1 race times', 'F1 qualifying time',
    'F1 session schedule', 'Formula 1 timezone', 'F1 local time', 'Grand Prix 2026 schedule',
    'F1 practice times', 'F1 2026 calendar', 'Formula 1 race weekend times',
  ],
  alternates: { canonical: '/schedule' },
  openGraph: {
    title: 'F1 2026 Race Schedule — Session Times in Your Timezone',
    description: 'Every Practice, Qualifying and Race session for the 2026 F1 season — instantly converted to your local timezone.',
    url: '/schedule',
    type: 'website',
    siteName: 'F1RaceSignature',
    locale: 'en_US',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 2026 Race Schedule — F1RaceSignature' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'F1 2026 Race Schedule — All Session Times',
    description: 'Practice, Qualifying, Sprint & Race times for every 2026 Grand Prix — shown in your local timezone.',
    images: ['/opengraph-image'],
  },
}

export default async function SchedulePage() {
  const races = await getSchedule()

  // Build JSON-LD for each race as a SportsEvent — enables rich results in Google Search
  const eventsLd = races.map(race => ({
    '@type': 'SportsEvent',
    name: `${race.raceName} 2026`,
    startDate: race.time ? `${race.date}T${race.time}` : race.date,
    location: {
      '@type': 'Place',
      name: race.Circuit.circuitName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: race.Circuit.Location.locality,
        addressCountry: race.Circuit.Location.country,
      },
    },
    organizer: { '@type': 'Organization', name: 'Formula 1' },
    sport: 'Auto Racing',
    url: 'https://f1racesignature.site/schedule',
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: 'F1 2026 Race Schedule',
        description: 'Full 2026 Formula 1 calendar with session times in every timezone.',
        url: 'https://f1racesignature.site/schedule',
        isPartOf: { '@id': 'https://f1racesignature.site/#website' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://f1racesignature.site' },
            { '@type': 'ListItem', position: 2, name: 'Schedule' },
          ],
        },
      },
      ...eventsLd,
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen" style={{ background: '#030303' }}>

        {/* Hero */}
        <div className="relative border-b border-[#0f0f0f] py-14 px-6 text-center overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 70%)' }}
          />
          <p className="relative text-[10px] font-mono uppercase tracking-widest mb-4 text-[#d4a017]">
            Formula 1 · 2026 Season
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-3"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            Race Schedule
          </h1>
          <p className="relative text-white/60 text-sm max-w-sm mx-auto">
            Every session, every timezone. Pick yours from the dropdown and never miss a flag.
          </p>
        </div>

        {/* Schedule */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
          <ScheduleView races={races} />
        </div>

      </main>
      <Footer />
    </>
  )
}
