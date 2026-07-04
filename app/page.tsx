import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FAQ } from '@/components/landing/FAQ'
import { ThisWeekendBanner } from '@/components/landing/ThisWeekendBanner'
import { GamesOfTheDay } from '@/components/landing/GamesOfTheDay'
import { FAQ_ITEMS } from '@/lib/faq'
import { ARTICLES } from '@/lib/articles'
import { getAllDrivers } from '@/lib/serverData'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

export default function HomePage() {
  const recentArticles = [...ARTICLES]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  const drivers = getAllDrivers()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />

      {/* Floating Ko-fi support button */}
      <a
        href="https://ko-fi.com/jascodingvibes"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support on Ko-fi"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0a0a0a] border border-[#d4a017]/40 text-[#d4a017] text-sm font-medium shadow-lg hover:bg-[#d4a017] hover:text-black hover:border-[#d4a017] transition-all duration-200 group"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682-.028-1.682-.028V7.284h1.7s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
        </svg>
        Support
      </a>

      <main className="pt-14">
        <ThisWeekendBanner />
        <Hero />
        <HowItWorks />

        {/* Games of the Day — three daily-rotating picks */}
        <GamesOfTheDay />

        {/* Latest from the Blog */}
        <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-2">
                  Analysis & History
                </p>
                <h2
                  className="text-2xl md:text-3xl text-white"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Latest F1 Articles
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden sm:flex items-center gap-1.5 text-white/65 text-sm hover:text-[#d4a017] transition-colors"
              >
                View all
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {recentArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#d4a017] text-[10px] font-mono uppercase tracking-wider">
                      {article.category}
                    </span>
                    <span className="text-white/20 text-[10px]">·</span>
                    <span className="text-white/65 text-[10px] font-mono">{article.readMinutes} min</span>
                  </div>
                  <h3
                    className="text-white text-base leading-snug mb-2 group-hover:text-[#d4a017] transition-colors"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    {article.title}
                  </h3>
                  <p className="text-white/65 text-xs leading-relaxed line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-[#d4a017]/70 text-[10px] font-medium group-hover:text-[#d4a017] transition-colors">
                    Read article
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="group-hover:translate-x-0.5 transition-transform">
                      <path d="M2 5h6M5.5 2.5l2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 sm:hidden text-center">
              <Link href="/blog" className="text-white/65 text-sm hover:text-[#d4a017] transition-colors">
                View all articles →
              </Link>
            </div>
          </div>
        </section>

        {/* Browse by Driver */}
        <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-2">
                  The Legends
                </p>
                <h2
                  className="text-2xl md:text-3xl text-white"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  Browse by Driver
                </h2>
              </div>
              <Link
                href="/drivers"
                className="hidden sm:flex items-center gap-1.5 text-white/65 text-sm hover:text-[#d4a017] transition-colors"
              >
                All drivers
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {drivers.map((driver) => (
                <Link
                  key={driver.id}
                  href={`/drivers/${driver.id}`}
                  className="group flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-all"
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: driver.color + '33', border: `1px solid ${driver.color}66` }}
                  >
                    {driver.shortName.slice(0, 2)}
                  </span>
                  <span className="text-white/70 text-xs font-medium group-hover:text-white transition-colors">
                    {driver.name}
                  </span>
                  {driver.championships > 0 && (
                    <span className="text-white/25 text-[9px] font-mono">
                      {driver.championships}×
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SEO content — crawlable description of the product */}
        <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2
              className="text-3xl md:text-4xl text-white mb-6"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Formula 1 telemetry, reimagined as art
            </h2>
            <p className="text-white/65 leading-relaxed mb-4">
              F1RaceSignature transforms real Formula 1 lap data into collectible poster art. Every
              print is built from genuine GPS car-position telemetry — the exact racing line a driver
              carved through Eau Rouge, the Casino chicane, or Copse — mapped onto an accurate circuit
              outline and rendered in a cinematic, gallery-ready style.
            </p>
            <p className="text-white/65 leading-relaxed mb-4">
              Choose from legendary drives by Ayrton Senna, Lewis Hamilton, Michael Schumacher, Max
              Verstappen, Charles Leclerc, Lando Norris and more. Visualize the lap as a racing line,
              a blue-to-red speed heatmap, a three-sector split, or an overtake map — then apply one
              of eight artistic themes and export a high-resolution poster, free.
            </p>
            <p className="text-white/65 text-sm leading-relaxed">
              Browse the full{' '}
              <Link href="/drivers" className="text-[#d4a017] hover:underline">driver collection</Link>,
              read our{' '}
              <Link href="/blog" className="text-[#d4a017] hover:underline">F1 articles and analysis</Link>,
              or follow the{' '}
              <Link href="/results" className="text-[#d4a017] hover:underline">live 2026 F1 season standings</Link>.
            </p>
          </div>
        </section>

        {/* Live 2026 Standings teaser */}
        <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6">
            <Link
              href="/results"
              className="group block rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 md:p-8 hover:border-[#d4a017]/40 transition-colors relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#38b000] animate-pulse" />
                    <span className="text-[#38b000] text-xs font-medium uppercase tracking-widest">Live Now</span>
                  </div>
                  <h2
                    className="text-2xl md:text-3xl text-white"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    Follow the 2026 F1 Season
                  </h2>
                  <p className="text-white/65 text-sm mt-2 max-w-md">
                    Live driver and constructor standings, latest race results, and the full calendar —
                    real F1 data, updated automatically.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 text-white font-medium rounded-xl border border-white/10 group-hover:bg-[#d4a017] group-hover:text-black group-hover:border-[#d4a017] transition-all whitespace-nowrap self-start">
                  View Standings
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Mini Games teaser */}
        <section className="py-12 md:py-14 border-t border-[#0f0f0f]">
          <div className="max-w-7xl mx-auto px-6">
            <Link
              href="/games"
              className="group block rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 md:p-8 hover:border-[#d4a017]/40 transition-colors relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-2">
                    Mini Games
                  </p>
                  <h2
                    className="text-2xl md:text-3xl text-white"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    Test Your F1 Instincts
                  </h2>
                  <p className="text-white/65 text-sm mt-2 max-w-md">
                    Reaction tests, driver quizzes, circuit puzzles, and pit-wall strategy — a
                    growing collection of free games you can finish in under two minutes.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {['Reaction Test', 'F1 Knowledge', 'Circuit Puzzle', 'F1 Strategy'].map((tag) => (
                      <span
                        key={tag}
                        className="text-white/65 text-xs font-mono uppercase tracking-wider border border-[#1a1a1a] rounded px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 text-white font-medium rounded-xl border border-white/10 group-hover:bg-[#d4a017] group-hover:text-black group-hover:border-[#d4a017] transition-all whitespace-nowrap self-start">
                  Play Games
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </section>

        <FAQ />

        {/* CTA section */}
        <section className="py-16 md:py-20 border-t border-[#0f0f0f] text-center">
          <div className="max-w-2xl mx-auto px-6">
            <p
              className="text-4xl md:text-5xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Ready to create
              <br />
              <span className="text-[#d4a017]">your poster?</span>
            </p>
            <p className="text-white/65 mb-8">
              Free to start. No account required. Just pick a driver and create.
            </p>
            <a
              href="/studio"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-all hover:scale-105 active:scale-100"
            >
              Open the Studio
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
