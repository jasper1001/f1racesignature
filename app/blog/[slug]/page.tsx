import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getArticle, getAllArticleSlugs, ARTICLES } from '@/lib/articles'

const SITE_URL = 'https://f1racesignature.site'

const ARTICLE_KEYWORDS: Record<string, string[]> = {
  'f1-2026-regulations-explained': [
    'F1 2026 regulations', 'F1 2026 rules', 'F1 2026 engine', 'F1 2026 power unit',
    '2026 F1 active aerodynamics', 'F1 2026 sustainable fuel', 'F1 DRS replacement override',
    'F1 2026 car changes', 'Formula 1 2026 regulations explained',
  ],
  'madrid-f1-grand-prix-2026': [
    'Madrid F1', 'Madrid Grand Prix 2026', 'Madrid F1 circuit', 'IFEMA F1 circuit',
    'Madring', 'F1 2026 calendar Madrid', 'Spanish Grand Prix Madrid', 'new F1 circuit 2026',
  ],
  'cadillac-f1-2026-entry': [
    'Cadillac F1', 'Cadillac Formula 1 2026', 'General Motors F1', 'GM F1 team',
    'F1 11th team', 'Cadillac F1 drivers', 'Sergio Perez Cadillac', 'new F1 team 2026',
  ],
  '10-greatest-f1-laps': [
    'greatest F1 laps of all time', 'best Formula 1 laps', 'Senna Monaco 1984 qualifying',
    'Hamilton greatest lap', 'Schumacher fastest lap', 'Verstappen Abu Dhabi 2021',
    'iconic F1 moments', 'Formula 1 lap records', 'F1 qualifying laps history',
  ],
  'how-to-read-f1-telemetry': [
    'how to read F1 telemetry', 'F1 telemetry data explained', 'Formula 1 speed trace',
    'F1 GPS racing line', 'what is F1 telemetry', 'F1 sector times explained',
    'Formula 1 data analysis beginner', 'F1 throttle brake trace', 'racing line telemetry',
  ],
  'senna-schumacher-hamilton-greatest': [
    'greatest Formula 1 driver of all time', 'Senna vs Schumacher vs Hamilton',
    'best F1 driver ever', 'Hamilton Schumacher Senna comparison',
    'who is the best F1 driver', 'F1 GOAT debate', 'Formula 1 greatest drivers history',
  ],
  'f1-racing-lines-explained': [
    'F1 racing line explained', 'what is a racing line Formula 1', 'late apex vs geometric apex',
    'how do F1 drivers choose racing line', 'F1 corner technique', 'Formula 1 oversteer understeer',
    'F1 tyre management racing line', 'how to drive racing line',
  ],
  'f1-data-strategy': [
    'how F1 teams use data', 'Formula 1 race strategy data', 'F1 pit stop strategy explained',
    'Formula 1 race engineers data', 'F1 machine learning strategy', 'how F1 strategy works',
    'Formula 1 pit wall data', 'F1 tyre degradation data',
  ],
  'greatest-f1-championships': [
    'greatest F1 championship battles', 'Senna vs Prost rivalry', 'Hamilton vs Verstappen 2021',
    'closest F1 championship ever', 'Hamilton vs Rosberg 2016', 'Schumacher vs Hill 1994',
    'best F1 seasons in history', 'Formula 1 title deciders',
  ],
  'understanding-f1-sector-times': [
    'F1 sector times explained', 'what do F1 sector colours mean', 'purple sector F1 meaning',
    'how to read F1 sector times', 'Formula 1 mini sectors', 'F1 timing data explained',
    'green purple yellow sectors Formula 1',
  ],
  'iconic-f1-circuits-explained': [
    'best Formula 1 circuits', 'Monaco circuit explained', 'Spa Francorchamps F1',
    'Suzuka circuit Formula 1', 'Monza Temple of Speed', 'Silverstone F1 circuit',
    'iconic F1 tracks history', 'greatest F1 circuits of all time',
  ],
  'hamilton-vs-schumacher': [
    'Hamilton vs Schumacher greatest F1 driver', 'is Hamilton better than Schumacher',
    'Hamilton Schumacher world championships comparison', 'who has more F1 wins Hamilton or Schumacher',
    'greatest F1 driver debate', 'Hamilton 7 championships Schumacher', 'F1 GOAT Hamilton Schumacher',
  ],
  'lost-f1-circuits': [
    'F1 circuits no longer on calendar', 'lost Formula 1 tracks', 'Imola F1 history',
    'Adelaide street circuit F1', 'Istanbul Park F1 Turn 8', 'why did F1 leave Sepang',
    'old Hockenheim F1 forest section', 'Magny-Cours French Grand Prix', 'Estoril Portuguese Grand Prix',
    'Formula 1 circuits dropped from calendar',
  ],
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function estimateWordCount(article: ReturnType<typeof getArticle>): number {
  if (!article) return 0
  const words = [article.intro, ...article.sections.flatMap((s) => s.paragraphs)].join(' ')
  return Math.round(words.split(/\s+/).length / 100) * 100
}

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return {}

  const keywords = ARTICLE_KEYWORDS[slug] ?? [article.category, 'Formula 1', 'F1 history']

  return {
    title: `${article.title} — F1RaceSignature`,
    description: article.description,
    keywords,
    authors: [{ name: 'F1RaceSignature', url: SITE_URL }],
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/blog/${slug}`,
      type: 'article',
      siteName: 'F1RaceSignature',
      publishedTime: article.date,
      modifiedTime: article.date,
      section: article.category,
      tags: keywords.slice(0, 6),
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: ['/opengraph-image'],
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()

  const wordCount = estimateWordCount(article)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${SITE_URL}/blog/${slug}#article`,
        headline: article.title,
        description: article.description,
        datePublished: article.date,
        dateModified: article.date,
        wordCount,
        timeRequired: `PT${article.readMinutes}M`,
        articleSection: article.category,
        inLanguage: 'en',
        keywords: (ARTICLE_KEYWORDS[slug] ?? []).join(', '),
        author: { '@type': 'Organization', name: 'F1RaceSignature', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'F1RaceSignature',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
        about: { '@type': 'Thing', name: 'Formula 1' },
        image: { '@type': 'ImageObject', url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE_URL}/blog/${slug}` },
        ],
      },
    ],
  }

  const others = ARTICLES.filter((a) => a.slug !== slug && a.category === article.category).slice(0, 3)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-6 pt-8 text-xs text-white/50">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-2 text-white/25">/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span className="mx-2 text-white/25">/</span>
          <Link href={`/blog?category=${encodeURIComponent(article.category)}`} className="hover:text-white transition-colors">
            {article.category}
          </Link>
          <span className="mx-2 text-white/25">/</span>
          <span className="text-white/65 line-clamp-1">{article.title}</span>
        </div>

        {/* Article header */}
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-8 border-b border-[#0f0f0f]">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest">{article.category}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40 text-[10px] font-mono">{article.readMinutes} min read</span>
            <span className="text-white/20">·</span>
            <time dateTime={article.date} className="text-white/40 text-[10px] font-mono">
              {formatDate(article.date)}
            </time>
            {wordCount > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-white/40 text-[10px] font-mono">~{wordCount.toLocaleString()} words</span>
              </>
            )}
          </div>
          <h1
            className="text-3xl md:text-5xl text-white leading-tight mb-6"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {article.title}
          </h1>
          <p className="text-white/65 text-lg leading-relaxed">{article.intro}</p>
        </div>

        {/* Article body */}
        <article className="max-w-3xl mx-auto px-6 py-10">
          {article.sections.map((section, si) => (
            <section key={si} className="mb-10">
              {section.heading && (
                <h2
                  className="text-xl md:text-2xl text-white mb-4"
                  style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                >
                  {section.heading}
                </h2>
              )}
              {section.paragraphs.map((p, pi) => (
                <p key={pi} className="text-white/70 leading-relaxed mb-4 text-base">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </article>

        {/* Tags / keywords */}
        {ARTICLE_KEYWORDS[slug] && (
          <div className="max-w-3xl mx-auto px-6 pb-10">
            <div className="flex flex-wrap gap-2">
              {ARTICLE_KEYWORDS[slug].slice(0, 6).map((kw) => (
                <span
                  key={kw}
                  className="text-white/35 text-[10px] font-mono border border-[#1a1a1a] rounded px-2.5 py-1"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related articles */}
        {others.length > 0 && (
          <div className="max-w-3xl mx-auto px-6 pb-10 border-t border-[#0f0f0f] pt-10">
            <h3 className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-6">
              More in {article.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {others.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="group rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-4 hover:border-[#2a2a2a] transition-all"
                >
                  <p className="text-white/35 text-[10px] font-mono mb-2">{a.readMinutes} min read</p>
                  <h4
                    className="text-white text-sm leading-snug group-hover:text-[#d4a017] transition-colors"
                    style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                  >
                    {a.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-6 pb-16">
          <div className="rounded-xl border border-[#d4a017]/20 bg-[#d4a017]/5 p-6 text-center">
            <p className="text-white text-sm font-medium mb-1">Turn a legendary F1 lap into poster art</p>
            <p className="text-white/55 text-sm mb-4">Real GPS telemetry. Real racing lines. Free to create.</p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d4a017] text-black font-semibold rounded-xl hover:bg-[#e8b84b] transition-colors text-sm"
            >
              Open the Studio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
