// The F1RaceSignature mark: a gold racing line written like a signature, with a
// white underline stroke. Same drawing as public/favicon.svg, minus the tile.
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="3 6 26 21" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5.5 19.5c3.4-.4 4.6-9.3 9-9.3 3.5 0 2.7 7.3 6.3 7.3 2.6 0 4-4.4 5.7-8.3" stroke="#d4a017" strokeWidth="2.6" />
      <path d="M7 24.6c6.2-1.4 12.6-1.7 18.8-2.4" stroke="#ffffff" strokeWidth="1.6" />
    </svg>
  )
}
