import { countryCode } from '@/lib/circuitFacts'

/**
 * A country flag rendered as a self-hosted SVG image. Emoji flags don't render
 * on Windows (they fall back to the letter code), so we use images everywhere.
 * Falls back to the 🏁 glyph for any country we don't have a code for.
 */
export function FlagIcon({
  country,
  className = 'h-4 w-6',
}: {
  country: string
  className?: string
}) {
  const code = countryCode(country)
  if (!code) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
        🏁
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      alt={`${country} flag`}
      loading="lazy"
      className={`inline-block object-cover rounded-[2px] ring-1 ring-black/40 ${className}`}
    />
  )
}
