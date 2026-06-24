import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ARTICLES } from '@/lib/articles'

export const metadata: Metadata = {
  title: 'F1 Articles & Analysis — F1RaceSignature Blog',
  description:
    'In-depth Formula 1 articles: the greatest laps ever driven, how to read F1 telemetry, Hamilton vs Schumacher, iconic circuits explained, and the championship battles that defined the sport.',
  keywords: [
    'F1 articles', 'Formula 1 analysis', 'F1 history', 'F1 telemetry guide',
    'Hamilton vs Schumacher', 'greatest F1 laps', 'F1 circuits explained',
    'F1 championship battles', 'Formula 1 blog',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'F1 Articles & Analysis — F1RaceSignature',
    description: 'In-depth articles on F1 history, telemetry, circuits, and the greatest drivers of all time.',
    url: '/blog',
    type: 'website',
    siteName: 'F1RaceSignature',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'F1RaceSignature Blog' }],
  },
}

const CATEGORY_ORDER = ['F1 Basics', 'F1 2026', 'F1 History', 'F1 Technology', 'F1 Circuits']

export default function BlogPage() {
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    articles: ARTICLES.filter((a) => a.category === cat),
  })).filter((g) => g.articles.length > 0)

  return (
    <>
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Hero */}
        <div className="relative py-20 border-b border-[#0f0f0f] overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,160,23,0.05) 0%, transparent 70%)',
            }}
          />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <p className="text-[#d4a017] text-xs font-medium uppercase tracking-widest mb-4">Analysis & History</p>
            <h1
              className="text-4xl md:text-6xl text-white mb-4"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              F1 Articles
            </h1>
            <p className="text-white/65 text-lg max-w-xl mx-auto">
              Deep dives into Formula 1 history, technology, and the drivers who define the sport.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
          {byCategory.map(({ category, articles }) => (
            <section key={category}>
              {/* Category header */}
              <div className="flex items-center gap-4 mb-8">
                <span className="text-[#d4a017] text-[10px] font-mono uppercase tracking-[0.15em] shrink-0">{category}</span>
                <span className="flex-1 h-px bg-[#141414]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-5 hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] text-white/65 font-mono uppercase tracking-wider">{article.category}</span>
                      <span className="text-white/20 text-[10px]">·</span>
                      <span className="text-[10px] text-white/65 font-mono">{article.readMinutes} min read</span>
                    </div>
                    <h2
                      className="text-white text-lg leading-snug mb-2 group-hover:text-[#d4a017] transition-colors"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      {article.title}
                    </h2>
                    <p className="text-white/65 text-sm leading-relaxed line-clamp-3">{article.description}</p>
                    <div className="flex items-center gap-1.5 mt-4 text-[#d4a017] text-xs font-medium">
                      Read article
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="group-hover:translate-x-0.5 transition-transform">
                        <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
