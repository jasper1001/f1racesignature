'use client'

import {
  getAffiliateProducts,
  TEAM_META,
  teamLabel,
  type AffiliateProduct,
} from '@/lib/affiliateProducts'
import { Analytics } from '@/lib/analytics'

// Ad-style shelf of official F1 team merch (Amazon affiliate). Curated like a
// Google Ads slot but hand-picked from affiliateProducts.ts. The `placement`
// prop tags clicks so we can compare performance across spots (homepage,
// driver page, etc.).
//
// FTC: affiliate links must be disclosed — the "Affiliate" tag + footnote do that.

function ProductCard({
  product,
  placement,
}: {
  product: AffiliateProduct
  placement: string
}) {
  const accent = TEAM_META[product.team]?.color ?? '#d4a017'

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      data-track={`affiliate:${product.id}`}
      onClick={() =>
        Analytics.affiliateClicked({
          productId: product.id,
          team: product.team,
          type: product.type,
          placement,
        })
      }
      className="group flex flex-col rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-all"
    >
      {/* Image — white plate so product cut-outs read against the dark card */}
      <div className="relative aspect-square bg-white flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={`${teamLabel(product.team)} merch`}
          loading="lazy"
          className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
        />
        <span
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-white"
          style={{ backgroundColor: accent }}
        >
          {teamLabel(product.team)}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-white/45 text-[10px] font-mono uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        <h3
          className="text-white text-base leading-snug font-display"
        >
          {teamLabel(product.team)} Merch
        </h3>
        <span className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-white text-sm font-medium border border-white/10 group-hover:bg-[#d4a017] group-hover:text-black group-hover:border-[#d4a017] transition-all">
          Shop on Amazon
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </a>
  )
}

export function AffiliateShelf({
  team,
  placement = 'homepage',
  title = 'Official F1 Fan Shop',
  subtitle = 'Gear up with official team merch',
}: {
  /** Optional team slug to restrict the shelf to one team. */
  team?: string
  placement?: string
  title?: string
  subtitle?: string
}) {
  const products = getAffiliateProducts(team ? { team } : undefined)
  if (products.length === 0) return null

  return (
    <section className="py-12 md:py-14 border-t border-[#0f0f0f]" data-section="affiliate-shelf">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-2">
              {subtitle}
            </p>
            <h2
              className="text-2xl md:text-3xl text-white font-display"
            >
              {title}
            </h2>
          </div>
          <span className="text-white/40 text-[10px] font-mono uppercase tracking-wider border border-[#1a1a1a] rounded px-2 py-1 shrink-0">
            Affiliate
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} placement={placement} />
          ))}
        </div>

        <p className="text-white/40 text-xs mt-5 leading-relaxed">
          As an Amazon Associate we earn from qualifying purchases. Prices and availability are
          set by Amazon and may change.
        </p>
      </div>
    </section>
  )
}
