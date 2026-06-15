import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getArticle, getAllArticleSlugs, ARTICLES } from '@/lib/articles'

export function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return {}
  const SITE_URL = 'https://f1racesignature.site'
  return {
    title: `${article.title} — F1RaceSignature`,
    description: article.description,
    keywords: [article.category, 'Formula 1', 'F1 history', 'F1 analysis', article.title],
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/blog/${slug}`,
      type: 'article',
      siteName: 'F1RaceSignature',
      publishedTime: article.date,
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

  const SITE_URL = 'https://f1racesignature.site'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { '@type': 'Organization', name: 'F1RaceSignature', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'F1RaceSignature', url: SITE_URL },
    url: `${SITE_URL}/blog/${slug}`,
    inLanguage: 'en',
    about: { '@type': 'Thing', name: 'Formula 1' },
  }

  const others = ARTICLES.filter((a) => a.slug !== slug && a.category === article.category).slice(0, 3)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="pt-14 min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-6 pt-8 text-xs text-white/50">
          <Link href="/" className="hover:text-white">Home</Link>
          <span className="mx-2 text-white/25">/</span>
          <Link href="/blog" className="hover:text-white">Blog</Link>
          <span className="mx-2 text-white/25">/</span>
          <span className="text-white/65 line-clamp-1">{article.title}</span>
        </div>

        {/* Article header */}
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-8 border-b border-[#0f0f0f]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#d4a017] text-[10px] font-mono uppercase tracking-widest">{article.category}</span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/40 text-[10px] font-mono">{article.readMinutes} min read</span>
          </div>
          <h1
            className="text-3xl md:text-5xl text-white leading-tight mb-6"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {article.title}
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">{article.intro}</p>
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

        {/* Related articles */}
        {others.length > 0 && (
          <div className="max-w-3xl mx-auto px-6 pb-16 border-t border-[#0f0f0f] pt-10">
            <h3 className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-6">More in {article.category}</h3>
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
            <p className="text-white/70 text-sm mb-4">Turn a legendary F1 lap into museum-quality poster art with real telemetry data.</p>
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
