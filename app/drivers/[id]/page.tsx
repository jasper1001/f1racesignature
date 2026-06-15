import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getAllDrivers, getDriver, getRacesForDriver } from '@/lib/serverData'
import { getDriverCareer } from '@/lib/driverCareer'

export function generateStaticParams() {
  return getAllDrivers().map((d) => ({ id: d.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const driver = getDriver(id)
  if (!driver) return {}
  const title = `${driver.name} — F1 Telemetry Poster Art`
  const description = `Create collectible poster art from ${driver.name}'s legendary laps. Real F1 racing lines, speed traces, and sector data rendered as cinematic prints. ${driver.bio}`
  return {
    title,
    description,
    alternates: { canonical: `/drivers/${driver.id}` },
    openGraph: {
      title,
      description,
      url: `/drivers/${driver.id}`,
      type: 'profile',
      siteName: 'F1RaceSignature',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  }
}

export default async function DriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const driver = getDriver(id)
  if (!driver) notFound()

  const races = getRacesForDriver(id)
  const career = getDriverCareer(id)

  const SITE_URL = 'https://f1racesignature.site'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        name: driver.name,
        jobTitle: 'Formula 1 Driver',
        nationality: driver.nationality,
        description: driver.bio,
        url: `${SITE_URL}/drivers/${driver.id}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Drivers', item: `${SITE_URL}/drivers` },
          { '@type': 'ListItem', position: 3, name: driver.name, item: `${SITE_URL}/drivers/${driver.id}` },
        ],
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-6 pt-8 text-xs text-white/50">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2 text-white/25">/</span>
          <Link href="/drivers" className="hover:text-white">Drivers</Link>
          <span className="mx-2 text-white/25">/</span>
          <span className="text-white/65">{driver.name}</span>
        </div>

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ backgroundColor: driver.color + '22', border: `1px solid ${driver.color}55` }}
            >
              {driver.shortName}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl text-white" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {driver.name}
              </h1>
              <p className="text-white/55 mt-2">
                {driver.team} · {driver.nationality}
                {driver.championships > 0 && ` · ${driver.championships}× World Champion`}
              </p>
            </div>
          </div>
          <p className="text-white/65 leading-relaxed mt-6 max-w-2xl">{driver.bio}</p>

          <Link
            href={`/studio?driver=${driver.id}`}
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-colors"
          >
            Create a {driver.name.split(' ')[0]} poster
          </Link>
        </div>

        {/* Career biography */}
        {career.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 py-8 border-t border-[#0f0f0f]">
            <h2 className="text-2xl text-white mb-6" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Career
            </h2>
            <div className="max-w-3xl space-y-4">
              {career.map((paragraph, i) => (
                <p key={i} className="text-white/65 leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* Races */}
        <div className="max-w-5xl mx-auto px-6 py-8 border-t border-[#0f0f0f]">
          <h2 className="text-2xl text-white mb-6" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Legendary {driver.name.split(' ')[1] ?? driver.name} drives
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {races.map((race) => (
              <Link
                key={race.id}
                href={`/race/${race.id}`}
                className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 hover:border-[#333333] transition-colors"
                style={{ borderLeftColor: driver.color, borderLeftWidth: 3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm group-hover:text-[#d4a017] transition-colors">
                    {race.name}
                  </span>
                  <span className="text-[#d4a017] font-mono text-sm">{race.lapTime}</span>
                </div>
                <p className="text-white/50 text-xs mt-1">{race.circuitName} · {race.location}</p>
                <p className="text-white/55 text-xs mt-2 line-clamp-2">{race.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
