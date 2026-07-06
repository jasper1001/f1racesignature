'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { pickRandomProduct, TEAM_META, teamLabel, type AffiliateProduct } from '@/lib/affiliateProducts'
import { Analytics } from '@/lib/analytics'
import { CONSENT_SET_EVENT, hasAnsweredConsent } from '@/components/layout/CookieBanner'

// Floating ad — a single Amazon-affiliate product, honestly branded in the
// site's own style. Mounted once in the root layout so it rides along on every
// page except the Studio (the poster editor needs the full canvas).
//
//  - Desktop (xl+): vertical side rail pinned to the LEFT edge (the right edge
//    already has the EXPLORE tab). Shows on all non-Studio pages.
//  - Mobile (< xl): bottom banner — but only on NON-game pages, since game pages
//    already carry the in-content InlineAffiliateAd slots on mobile.
//
// Waits until the visitor has answered the cookie banner (so the two never
// stack at the bottom of a first-visit mobile screen), picks a product after
// mount, re-picks on route change, and rotates on a slow timer. Dismissible
// for the session.

const DISMISS_KEY = 'f1rs_floating_ad_dismissed_v2'

// How often the banner swaps to another random product while it stays on screen.
const ROTATE_MS = 45_000

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
  const [dismissed, setDismissed] = useState(false)
  // Hold the ad back until the cookie banner has been answered, so it never
  // fights the banner for the bottom of the screen.
  const [consentAnswered, setConsentAnswered] = useState(false)

  // Honour a prior dismissal for the session (sessionStorage is client-only, so
  // read it after mount). If storage is unavailable, hide to be safe.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) setDismissed(true)
    } catch {
      setDismissed(true)
    }
    setConsentAnswered(hasAnsweredConsent())
    const onConsent = () => setConsentAnswered(true)
    window.addEventListener(CONSENT_SET_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_SET_EVENT, onConsent)
  }, [])

  // Pick a random product on mount / route change, then keep rotating to another
  // random one every ROTATE_MS. Each pick excludes the current product so it
  // never shows the same one twice in a row.
  useEffect(() => {
    if (hidden || dismissed || !consentAnswered) {
      setProduct(null)
      return
    }
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
  }, [pathname, hidden, dismissed, consentAnswered])

  function dismiss() {
    setDismissed(true)
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

  // Honest ad chrome: a plain "Ad" tag + dismiss. No borrowed ad-network UI.
  const chrome = (
    <>
      <span className="text-white/45 text-[9px] font-mono uppercase tracking-wider leading-none select-none">
        Ad
      </span>
      <button
        onClick={dismiss}
        aria-label="Close ad"
        className="w-4 h-4 flex items-center justify-center rounded-sm text-white/45 hover:text-white hover:bg-white/10 transition-colors"
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
      <div className="hidden xl:block fixed left-4 top-1/2 -translate-y-1/2 z-40 w-[190px]">
        <div className="relative rounded-xl border border-[#222222] bg-[#0a0a0a] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-[#0f0f0f] border-b border-[#1a1a1a]">
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

            <div className="px-3 pt-2.5 pb-3 border-t border-[#1a1a1a]">
              <p className="text-white text-[13px] font-medium leading-snug">
                {label} Merch
              </p>
              <p className="text-white/65 text-[11px] leading-snug mt-0.5">Fan pick on Amazon</p>
              <span className="mt-2.5 flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-[#d4a017] text-black text-[13px] font-semibold group-hover:bg-[#e8b84b] transition-colors">
                Shop on Amazon
              </span>
            </div>
          </a>

          <div className="px-3 pb-2 -mt-1.5">
            <span className="text-white/45 text-[9px] leading-none">
              As an Amazon Associate we earn from qualifying purchases
            </span>
          </div>
        </div>
      </div>

      {/* ── Mobile: bottom banner (non-game pages only) ─────────────────────── */}
      {!isGamePage && (
        <div className="xl:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pointer-events-none">
          <div className="pointer-events-auto relative mx-auto flex max-w-md items-center gap-3 rounded-xl border border-[#222222] bg-[#0a0a0a] p-2.5 pr-9 shadow-[0_-2px_16px_rgba(0,0,0,0.6)]">
            <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5">{chrome}</div>

            <a {...linkProps} className="group flex flex-1 items-center gap-3 min-w-0">
              <span className="relative shrink-0 w-14 h-14 rounded-lg bg-white flex items-center justify-center p-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={`${label} merch`}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </span>

              <span className="flex flex-1 flex-col min-w-0">
                <span className="text-white text-[13px] font-medium leading-snug truncate">
                  {label} Merch
                </span>
                <span className="text-white/65 text-[11px] leading-snug">Fan pick on Amazon</span>
              </span>

              <span className="shrink-0 flex items-center justify-center px-3.5 py-2 rounded-lg bg-[#d4a017] text-black text-[12px] font-semibold group-hover:bg-[#e8b84b] transition-colors">
                Shop
              </span>
            </a>
          </div>
        </div>
      )}
    </>
  )
}
