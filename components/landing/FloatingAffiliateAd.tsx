'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { pickRandomProduct, TEAM_META, teamLabel, type AffiliateProduct } from '@/lib/affiliateProducts'
import { Analytics } from '@/lib/analytics'

// Floating ad — a single Amazon-affiliate product, styled like a Google display
// ad. Mounted once in the root layout so it rides along on every page except the
// Studio (the poster editor needs the full canvas).
//
//  - Desktop (xl+): vertical side rail pinned to the LEFT edge (the right edge
//    already has the EXPLORE tab). Shows on all non-Studio pages.
//  - Mobile (< xl): bottom banner — but only on NON-game pages, since game pages
//    already carry the in-content InlineAffiliateAd slots on mobile.
//
// Picks a product after mount and re-picks on every route change (client-only →
// no hydration mismatch). Dismissible for the session.

const DISMISS_KEY = 'f1rs_floating_ad_dismissed_v2'

// Routes the floating ad must never appear on.
const HIDDEN_PREFIXES = ['/studio']

export function FloatingAffiliateAd() {
  const pathname = usePathname()
  const hidden = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
  const isGamePage = pathname.startsWith('/games')
  // Attribute clicks by area so we can compare Studio-adjacent vs games vs rest.
  const placement = isGamePage ? 'games-floating' : 'site-floating'

  // Render nothing on the server / first paint, then reveal after mount.
  const [product, setProduct] = useState<AffiliateProduct | null>(null)

  // Re-pick a fresh random product on every route change (the ad stays mounted
  // across client-side navigations, so this is what makes the content rotate).
  useEffect(() => {
    if (hidden) {
      setProduct(null)
      return
    }
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return
    } catch {
      return
    }
    setProduct(pickRandomProduct())
  }, [pathname, hidden])

  function dismiss() {
    setProduct(null)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (!product) return null

  const accent = TEAM_META[product.team]?.color ?? '#d4a017'
  const label = teamLabel(product.team)
  const sans = 'arial, "Helvetica Neue", Helvetica, sans-serif'

  const linkProps = {
    href: product.affiliateUrl,
    target: '_blank',
    rel: 'sponsored nofollow noopener noreferrer',
    'data-track': `affiliate:${product.id}`,
    onClick: () =>
      Analytics.affiliateClicked({
        productId: product.id,
        team: product.team,
        type: product.type,
        placement,
      }),
  } as const

  // AdChoices info glyph + dismiss — shared by both layouts.
  const chrome = (
    <>
      <span className="flex items-center gap-0.5 text-[#5f6368] text-[10px] leading-none select-none">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a1.3 1.3 0 110 2.6A1.3 1.3 0 0112 7zm1.2 10h-2.4v-5.6h2.4V17z" />
        </svg>
        <svg width="7" height="7" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <path d="M1 3l4 4 4-4z" />
        </svg>
      </span>
      <button
        onClick={dismiss}
        aria-label="Close ad"
        className="w-4 h-4 flex items-center justify-center rounded-sm text-[#5f6368] hover:bg-[#e8eaed] transition-colors"
      >
        <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </>
  )

  return (
    <>
      {/* ── Desktop: vertical side rail (left edge) ─────────────────────────── */}
      <div
        className="hidden xl:block fixed left-4 top-1/2 -translate-y-1/2 z-40 w-[190px]"
        style={{ fontFamily: sans }}
      >
        <div className="relative rounded-lg border border-[#dadce0] bg-white overflow-hidden shadow-[0_1px_6px_rgba(32,33,36,0.28)]">
          <div className="flex items-center justify-end gap-1.5 px-2 py-1 bg-[#f8f9fa] border-b border-[#ebedf0]">
            {chrome}
          </div>

          <a {...linkProps} className="group block">
            <div className="relative h-32 bg-white flex items-center justify-center p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={`${label} merch`}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
              <span
                className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: accent }}
              >
                {label}
              </span>
            </div>

            <div className="px-3 pt-2.5 pb-3 border-t border-[#ebedf0]">
              <p className="text-[#202124] text-[13px] font-medium leading-snug">
                {label} Merch
              </p>
              <p className="text-[#188038] text-[11px] leading-snug mt-0.5">amazon.com</p>
              <span className="mt-2.5 flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-[18px] bg-[#1a73e8] text-white text-[13px] font-medium group-hover:bg-[#1765cc] transition-colors">
                Shop on Amazon
              </span>
            </div>
          </a>

          <div className="px-3 pb-2 -mt-1.5">
            <span className="text-[#9aa0a6] text-[9px] leading-none">
              Ad · As an Amazon Associate we earn from qualifying purchases
            </span>
          </div>
        </div>
      </div>

      {/* ── Mobile: bottom banner (non-game pages only) ─────────────────────── */}
      {!isGamePage && (
        <div
          className="xl:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pointer-events-none"
          style={{ fontFamily: sans }}
        >
          <div className="pointer-events-auto relative mx-auto flex max-w-md items-center gap-3 rounded-lg border border-[#dadce0] bg-white p-2.5 pr-8 shadow-[0_-2px_12px_rgba(32,33,36,0.22)]">
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">{chrome}</div>

            <a {...linkProps} className="group flex flex-1 items-center gap-3 min-w-0">
              <span className="relative shrink-0 w-14 h-14 rounded bg-white flex items-center justify-center p-1 overflow-hidden border border-[#ebedf0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={`${label} merch`}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </span>

              <span className="flex flex-1 flex-col min-w-0">
                <span className="text-[#202124] text-[13px] font-medium leading-snug truncate">
                  {label} Merch
                </span>
                <span className="text-[#188038] text-[11px] leading-snug">amazon.com</span>
              </span>

              <span className="shrink-0 flex items-center justify-center px-3.5 py-2 rounded-[18px] bg-[#1a73e8] text-white text-[12px] font-medium group-hover:bg-[#1765cc] transition-colors">
                Shop
              </span>
            </a>
          </div>
        </div>
      )}
    </>
  )
}
