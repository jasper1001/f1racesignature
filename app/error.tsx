'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Route-level error boundary — keeps a branded page up when a route crashes
// instead of Next's blank default screen.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#030303] px-6">
      <div className="max-w-md text-center">
        <p className="text-[#d4a017] text-xs font-mono uppercase tracking-widest mb-4">
          Red flag
        </p>
        <h1 className="text-3xl md:text-4xl text-white mb-4 font-display">
          Something went wrong
        </h1>
        <p className="text-white/65 text-sm mb-8">
          An unexpected error stopped this page. You can retry, or head back to
          the start line.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#d4a017] text-black text-sm font-semibold rounded-xl hover:bg-[#e8b84b] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 text-white/80 text-sm font-medium rounded-xl border border-[#222222] hover:text-white hover:border-[#444444] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
