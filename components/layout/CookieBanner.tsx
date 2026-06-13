'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'f1rs_cookie_consent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) {
      setVisible(true)
    } else if (stored === 'all') {
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem(CONSENT_KEY, 'all')
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
    setVisible(false)
  }

  const essentialOnly = () => {
    localStorage.setItem(CONSENT_KEY, 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-2xl mx-auto bg-[#0f0f0f] border border-[#222222] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-2xl pointer-events-auto">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">Cookie preferences</p>
          <p className="text-[#666666] text-xs mt-0.5">
            We use cookies for a better experience.{' '}
            <Link href="/cookies" className="text-[#d4a017] hover:underline">
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={essentialOnly}
            className="px-3 py-1.5 text-xs text-[#888888] border border-[#2a2a2a] rounded-lg hover:text-white hover:border-[#444444] transition-colors cursor-pointer"
          >
            Essential only
          </button>
          <button
            onClick={acceptAll}
            className="px-3 py-1.5 text-xs bg-[#d4a017] text-black font-medium rounded-lg hover:bg-[#e8b84b] transition-colors cursor-pointer"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
