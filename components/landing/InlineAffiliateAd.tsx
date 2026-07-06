'use client'

import { useEffect, useState } from 'react'
import { pickRandomProduct, TEAM_META, teamLabel, type AffiliateProduct } from '@/lib/affiliateProducts'
import { Analytics } from '@/lib/analytics'

// In-content affiliate ad for game pages — a horizontal card placed in the normal
// page flow (one below the hero, one above the footer). Mobile/tablet only
// (xl:hidden); on desktop the FloatingAffiliateAd side rail covers this instead.
//
// A random product is chosen on mount (client-only) so the ad rotates per load,
// then it keeps auto-rotating to another random product every ROTATE_MS while on
// screen. Rendering nothing until mounted keeps server markup stable (no flash).

// How often the card swaps to another random product while it stays on screen.
const ROTATE_MS = 10_000

export function InlineAffiliateAd({
  placement,
}: {
  /** e.g. "game-top" | "game-bottom" — used for click attribution. */
  placement: string
}) {
  const [product, setProduct] = useState<AffiliateProduct | null>(null)

  // Pick immediately, then rotate to a fresh random product (never the current
  // one) on an interval so the catalog cycles without a page reload.
  useEffect(() => {
    let currentId: string | undefined
    const rotate = () => {
      const next = pickRandomProduct(
        currentId ? { exclude: [currentId] } : undefined,
      )
      if (next) {
        currentId = next.id
        setProduct(next)
      }
    }
    rotate()
    const timer = window.setInterval(rotate, ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [])

  if (!product) return null

  const accent = TEAM_META[product.team]?.color ?? '#d4a017'
  const label = teamLabel(product.team)

  return (
    <div className="xl:hidden px-4 py-6" data-section="affiliate-inline">
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
        className="group relative mx-auto flex max-w-md items-center gap-3.5 rounded-xl border border-[#dcd5c6] bg-[#fbf9f4] p-3 pr-4 shadow-[0_4px_20px_rgba(26,23,18,0.06)]"
      >
        <span className="absolute top-2 right-2.5 text-[#1a1712]/35 text-[8px] font-mono uppercase tracking-wider">
          Affiliate
        </span>

        <span className="relative shrink-0 w-16 h-16 rounded-lg bg-white flex items-center justify-center p-1.5 overflow-hidden border border-[#ece7db]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={`${label} merch`}
            loading="lazy"
            className="max-h-full max-w-full object-contain"
          />
        </span>

        <span className="flex flex-1 flex-col min-w-0">
          <span
            className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider text-white self-start mb-1"
            style={{ backgroundColor: accent }}
          >
            {label}
          </span>
          <span
            className="text-[#1a1712] text-sm leading-snug truncate font-display"
          >
            {label} Merch
          </span>
          <span className="mt-1 inline-flex items-center gap-1 text-[#b8860b] text-[11px] font-semibold group-hover:text-[#d4a017] transition-colors">
            Shop on Amazon
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </a>
    </div>
  )
}
