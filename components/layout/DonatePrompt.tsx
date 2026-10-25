'use client'

import { useEffect, useRef, useState } from 'react'
import { Analytics } from '@/lib/analytics'
import { KOFI_URL } from '@/lib/site'
import { CONSENT_SET_EVENT, hasAnsweredConsent } from '@/components/layout/CookieBanner'

// Once-per-visit donation ask. Counts the visitor's clicks on links/buttons
// across pages (in sessionStorage), and once they've clearly engaged with the
// site it shows a polite Ko-fi modal. Closing it (or clicking the donate
// link) hides it for the rest of the visit; the next
// visit starts the count over.
//
// Held back until the cookie banner has been answered so the two never stack.

const COUNT_KEY = 'f1rs_donate_interactions'
const SEEN_KEY = 'f1rs_donate_prompt_seen'

// Clicks on links/buttons before the ask appears.
const INTERACTION_THRESHOLD = 8

// Short pause after the threshold click, so the modal doesn't hijack the very
// action the visitor just took.
const SHOW_DELAY_MS = 1_500

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
    sessionStorage.removeItem(COUNT_KEY)
  } catch {
    /* ignore */
  }
}

export function DonatePrompt() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const primaryRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return
    } catch {
      // Storage blocked — we couldn't remember a dismissal, so never ask.
      return
    }

    let count = 0
    try {
      count = Number(sessionStorage.getItem(COUNT_KEY)) || 0
    } catch {
      /* ignore */
    }

    let timer: number | undefined
    const tryShow = () => {
      if (count < INTERACTION_THRESHOLD || !hasAnsweredConsent() || timer) return
      document.removeEventListener('click', onClick, { capture: true })
      timer = window.setTimeout(() => {
        setOpen(true)
        Analytics.donatePromptShown(count)
      }, SHOW_DELAY_MS)
    }

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('a, button, [role="button"]')
      if (!el) return
      count += 1
      try {
        sessionStorage.setItem(COUNT_KEY, String(count))
      } catch {
        /* ignore */
      }
      tryShow()
    }

    document.addEventListener('click', onClick, { capture: true })
    window.addEventListener(CONSENT_SET_EVENT, tryShow)
    tryShow()

    return () => {
      document.removeEventListener('click', onClick, { capture: true })
      window.removeEventListener(CONSENT_SET_EVENT, tryShow)
      window.clearTimeout(timer)
    }
  }, [])

  // Fade in on the frame after mount, then focus the primary action.
  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => {
      setVisible(true)
      primaryRef.current?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      markSeen()
      Analytics.donatePromptDismissed('escape')
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function close(method: string) {
    markSeen()
    Analytics.donatePromptDismissed(method)
    setOpen(false)
  }

  function donate() {
    markSeen()
    Analytics.donateClicked('kofi', 'donate-prompt')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-prompt-title"
      data-section="donate-prompt"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => close('backdrop')} />

      <div
        className={`relative w-full max-w-sm rounded-2xl border border-[#222222] bg-[#0a0a0a] p-6 shadow-2xl transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-3'}`}
      >
        <button
          onClick={() => close('close_button')}
          aria-label="Close"
          data-track="donate_prompt_close"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-white/65 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <h2 id="donate-prompt-title" className="font-display text-white text-xl pr-8">
          A small favour
        </h2>
        <p className="mt-3 text-white text-sm leading-relaxed">
          Hi, I&apos;m the solo developer behind F1RaceSignature, and I keep it free for everyone.
          I&apos;m currently saving up for a kidney transplant and ongoing medication.
        </p>
        <p className="mt-2 text-white text-sm leading-relaxed">
          If you&apos;ve enjoyed the site, any donation, big or small, would mean a lot. Thank you.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <a
            ref={primaryRef}
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-track="donate_prompt_kofi"
            onClick={donate}
            className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-[#d4a017] text-black text-sm font-semibold hover:bg-[#e8b84b] transition-colors"
          >
            Support on Ko-fi
          </a>
          <button
            onClick={() => close('maybe_later')}
            data-track="donate_prompt_maybe_later"
            className="mt-1 text-white/65 text-xs hover:text-white transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
