'use client'

import { useState } from 'react'
import { shareResult } from '@/lib/shareResult'

// ── SVG icons ─────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="5" y="5" width="7" height="7" rx="1" />
      <path d="M9 5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ShareButtonsProps {
  /** The text to share / copy (plain text, newlines OK) */
  text: string
  /** The canonical page URL for Facebook's og:url fetch */
  url: string
}

export function ShareButtons({ text, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  const fbHref    = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  async function handleCopy() {
    const res = await shareResult(text)
    if (res === 'copied' || res === 'shared') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const base =
    'inline-flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active:scale-95 cursor-pointer border border-[#1f1f1f] bg-[#0d0d0d] hover:border-[#333] hover:bg-[#111] text-white'

  return (
    <div className="space-y-2">
      <p className="text-white text-[10px] font-mono uppercase tracking-widest opacity-40 text-center">Share result</p>
      <div className="grid grid-cols-3 gap-2">
        {/* Twitter / X */}
        <a
          href={tweetHref}
          target="_blank"
          rel="noopener noreferrer"
          className={base}
        >
          <XIcon />
          <span className="hidden sm:inline text-sm">Post</span>
        </a>

        {/* Facebook */}
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className={base}
        >
          <FacebookIcon />
          <span className="hidden sm:inline text-sm">Share</span>
        </a>

        {/* Copy / native share */}
        <button onClick={handleCopy} className={base}>
          {copied ? (
            <span className="text-[#38b000] text-xs">✓ Copied</span>
          ) : (
            <>
              <CopyIcon />
              <span className="hidden sm:inline text-sm">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
