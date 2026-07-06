import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getAllDrivers, getRacesForDriver } from '@/lib/serverData'

const SITE_URL = 'https://f1racesignature.site'

export function generateMetadata(): Metadata {
  const drivers = getAllDrivers()
  const champions = drivers.filter((d) => d.championships > 0).length
  const title = 'F1 Driver Collection — Senna, Hamilton, Verstappen & More'
  const description = `Browse all ${drivers.length} drivers in the F1RaceSignature collection — ${champions} world champions plus modern Grand Prix winners, from Ayrton Senna and Michael Schumacher to Lewis Hamilton, Max Verstappen, Charles Leclerc and Lando Norris. Turn their legendary laps into collectible poster art.`
  return {
    title,
    description,
    keywords: [
      'F1 drivers poster', 'Ayrton Senna poster', 'Lewis Hamilton poster art', 'Max Verstappen poster',
      'Michael Schumacher art', 'F1 driver collection', 'Formula 1 legends', 'F1 race art',
      'F1 driver prints', 'Lando Norris poster', 'Charles Leclerc art', 'F1 championship winners art',
    ],
    alternates: { canonical: '/drivers' },
    openGraph: {
      title,
      description: 'Turn legendary F1 drives by Senna, Hamilton, Schumacher, Verstappen, Leclerc, Norris and more into poster art.',
      url: '/drivers',
      type: 'website',
      siteName: 'F1RaceSignature',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1 Driver Collection — F1RaceSignature' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'Legendary F1 drives from Senna to Verstappen — turn any lap into poster art.',
      images: ['/opengraph-image'],
    },
  }
}

export default function DriversIndexPage() {
  const drivers = getAllDrivers()
  const champions = drivers.filter((d) => d.championships > 0).length

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'F1 Driver Collection',
        description: `Every Formula 1 driver in the F1RaceSignature collection — ${drivers.length} legends whose laps can be turned into telemetry poster art.`,
        url: `${SITE_URL}/drivers`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Drivers', item: `${SITE_URL}/drivers` },
          ],
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: drivers.length,
          itemListElement: drivers.map((d, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: d.name,
            url: `${SITE_URL}/drivers/${d.id}`,
          })),
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-6 pt-8 text-xs text-white/65">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2 text-white/25">/</span>
          <span className="text-white/65">Drivers</span>
        </nav>

        <div className="max-w-5xl mx-auto px-6 pt-10 pb-12 text-center">
          <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-4">The Drivers</p>
          <h1 className="text-4xl md:text-5xl text-white mb-4 font-display">
            Legends of Formula 1
          </h1>
          <p className="text-white/65 max-w-xl mx-auto">
            {drivers.length} drivers, decades of greatness — {champions} world champions and a new generation of
            Grand Prix winners. Pick a name to explore their iconic laps and turn them into art.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {drivers.map((d) => {
            const count = getRacesForDriver(d.id).length
            return (
              <Link
                key={d.id}
                href={`/drivers/${d.id}`}
                className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 hover:border-[#333333] transition-colors"
                style={{ borderTopColor: d.color, borderTopWidth: 3 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: d.color + '22', border: `1px solid ${d.color}55` }}
                  >
                    {d.shortName}
                  </div>
                  <div>
                    <div className="text-white font-medium group-hover:text-[#d4a017] transition-colors">{d.name}</div>
                    <div className="text-white/65 text-xs">{d.team}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 text-xs">
                  <span className="text-white/65">
                    {d.championships > 0 ? `${d.championships}× Champion` : 'Grand Prix winner'}
                  </span>
                  <span className="text-white/65 font-mono">{count} {count === 1 ? 'drive' : 'drives'}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}
