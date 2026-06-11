import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StaticPoster } from '@/components/StaticPoster'
import { getAllRaces, getRace, getDriver, getAllCircuits, getTelemetry } from '@/lib/serverData'

export function generateStaticParams() {
  return getAllRaces().map((r) => ({ id: r.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const race = getRace(id)
  if (!race) return {}
  const driver = getDriver(race.driverId)
  const driverName = driver?.name ?? ''
  const title = `${driverName} — ${race.name} Poster`
  const description = `${race.description} Lap time ${race.lapTime}. Turn this drive into collectible F1 poster art with real telemetry.`
  return {
    title,
    description,
    alternates: { canonical: `/race/${race.id}` },
    openGraph: { title, description, url: `/race/${race.id}`, type: 'article' },
  }
}

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const race = getRace(id)
  if (!race) notFound()

  const driver = getDriver(race.driverId)
  if (!driver) notFound()

  const circuit = getAllCircuits()[race.circuit] ?? null
  const telemetry = getTelemetry(race.telemetryFile)

  const studioUrl = `/studio?driver=${driver.id}&race=${race.id}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: `${driver.name} — ${race.name}`,
    about: `${driver.name}'s lap at the ${race.name}`,
    description: race.description,
    creator: { '@type': 'Organization', name: 'F1RaceSignature' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-6 pt-8 text-xs text-[#555555]">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2 text-[#2a2a2a]">/</span>
          <Link href={`/drivers/${driver.id}`} className="hover:text-white">{driver.name}</Link>
          <span className="mx-2 text-[#2a2a2a]">/</span>
          <span className="text-[#888888]">{race.year}</span>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Poster */}
          <div className="max-w-sm mx-auto w-full">
            <StaticPoster driver={driver} race={race} telemetry={telemetry} circuit={circuit} />
          </div>

          {/* Details */}
          <div>
            <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-3">
              {race.circuitName} · {race.year}
            </p>
            <h1 className="text-3xl md:text-4xl text-white mb-4" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {driver.name}
            </h1>
            <p className="text-[#888888] leading-relaxed mb-6">{race.description}</p>

            {telemetry && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Stat label="Lap Time" value={telemetry.lapTime} highlight />
                <Stat label="Top Speed" value={`${telemetry.topSpeed} km/h`} />
                <Stat label="Avg Speed" value={`${telemetry.averageSpeed} km/h`} />
                <Stat label="Data Points" value={`${telemetry.points.length}`} />
                <Stat label="Sector 1" value={`${telemetry.sectors.s1Time.toFixed(3)}s`} />
                <Stat label="Sector 2" value={`${telemetry.sectors.s2Time.toFixed(3)}s`} />
                <Stat label="Sector 3" value={`${telemetry.sectors.s3Time.toFixed(3)}s`} />
                <Stat label="Circuit" value={race.location} />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                href={studioUrl}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-colors"
              >
                Customize in Studio
              </Link>
              <Link
                href={`/drivers/${driver.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/8 transition-colors"
              >
                More from {driver.name.split(' ')[0]}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-[#161616] bg-[#0a0a0a] px-3 py-2">
      <div className="text-[10px] text-[#555555] uppercase tracking-wider">{label}</div>
      <div className={`font-mono text-sm mt-0.5 ${highlight ? 'text-[#d4a017]' : 'text-white'}`}>{value}</div>
    </div>
  )
}
