import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScheduleView } from '@/components/schedule/ScheduleView'
import { FaqSection } from '@/components/seo/FaqSection'
import { getSchedule, getSeason } from '@/lib/f1api'
import { SITE_URL, raceSportsEvent, faqPageJsonLd, scheduleFaqs } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const season = await getSeason()
  const title = `F1 ${season} Race Schedule — All Session Times by Timezone`
  const description = `Full ${season} Formula 1 race calendar with every session time — Practice, Qualifying, Sprint and Race — displayed in your local timezone. Never miss a session.`
  return {
    title,
    description,
    keywords: [
      `F1 ${season} schedule`, `Formula 1 calendar ${season}`, 'F1 race times', 'F1 qualifying time',
      'F1 session schedule', 'Formula 1 timezone', 'F1 local time', `Grand Prix ${season} schedule`,
      'F1 practice times', `F1 ${season} calendar`, 'Formula 1 race weekend times', 'F1 sprint schedule',
    ],
    alternates: { canonical: '/schedule' },
    openGraph: {
      title: `F1 ${season} Race Schedule — Session Times in Your Timezone`,
      description: `Every Practice, Qualifying and Race session for the ${season} F1 season — instantly converted to your local timezone.`,
      url: '/schedule',
      type: 'website',
      siteName: 'F1RaceSignature',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `F1 ${season} Race Schedule — F1RaceSignature` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `F1 ${season} Race Schedule — All Session Times`,
      description: `Practice, Qualifying, Sprint & Race times for every ${season} Grand Prix — shown in your local timezone.`,
      images: ['/opengraph-image'],
    },
  }
}

export default async function SchedulePage() {
  const [season, races] = await Promise.all([getSeason(), getSchedule()])

  const faqs = scheduleFaqs(races, season)

  // Per-race SportsEvent JSON-LD enables Event rich results in Google Search.
  const eventsLd = races.map((race) => raceSportsEvent(race, season, '/schedule'))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `F1 ${season} Race Schedule`,
        description: `Full ${season} Formula 1 calendar with session times in every timezone.`,
        url: `${SITE_URL}/schedule`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Schedule', item: `${SITE_URL}/schedule` },
          ],
        },
      },
      faqPageJsonLd(faqs),
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
            Formula 1 · {season} Season
          </p>
          <h1
            className="relative text-4xl md:text-5xl text-white mb-3"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            F1 {season} Race Schedule — Every Session Time in Your Local Timezone
          </h1>
          <p className="relative text-white/60 text-sm max-w-2xl mx-auto">
            The full {season} Formula 1 calendar with Practice, Qualifying, Sprint, and Race times for every Grand Prix. Select your timezone and all session times update instantly — no more converting UTC manually.
          </p>
        </div>

        {/* Schedule */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
          <ScheduleView races={races} />
        </div>

        {/* FAQ */}
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pb-14">
          <FaqSection items={faqs} title={`F1 ${season} schedule — your questions`} />
        </div>

      </main>
      <Footer />
    </>
  )
}
