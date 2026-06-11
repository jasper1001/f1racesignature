'use client'

import { useState } from 'react'
import { useStudioStore } from '@/lib/store'
import { Analytics } from '@/lib/analytics'

export function ShareButton() {
  const { selectedDriverId, selectedRaceId, vizMode, theme } = useStudioStore()
  const [copied, setCopied] = useState(false)

  const buildUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams()
    if (selectedDriverId) params.set('driver', selectedDriverId)
    if (selectedRaceId) params.set('race', selectedRaceId)
    params.set('theme', theme)
    params.set('viz', vizMode)
    return `${origin}/studio?${params.toString()}`
  }

  const share = async () => {
    const url = buildUrl()
    const title = 'My F1RaceSignature poster'
    const text = 'Check out this F1 lap rendered as art on F1RaceSignature'

    // Native share sheet (mostly mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        Analytics.shareClicked('native')
        return
      } catch {
        // user cancelled — fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      Analytics.shareClicked('copy')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      Analytics.shareClicked('failed')
    }
  }

  const disabled = !selectedDriverId || !selectedRaceId

  return (
    <button
      onClick={share}
      disabled={disabled}
      title="Share this poster"
      data-track="studio_share"
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-[#111111] text-[#aaaaaa] border border-[#222222] rounded-lg hover:text-white hover:border-[#333333] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {copied ? (
        <>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5l3.5 3.5L13 5" stroke="#38b000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline text-[#38b000]">Copied!</span>
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="12" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="12" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5.8 7l4.4-2.5M5.8 9l4.4 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Share</span>
        </>
      )}
    </button>
  )
}
