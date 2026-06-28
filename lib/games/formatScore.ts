// Human-friendly leaderboard score formatting. Time-based boards store their
// score in milliseconds (suffix 'ms'); raw ms reads badly for longer times
// (e.g. "12450ms"), so format those by magnitude while keeping milliseconds for
// short reaction/precision times where ms is the natural unit.

export function formatMs(ms: number): string {
  const v = Math.round(ms)
  if (v < 1000) return `${v}ms`            // reaction times, pit-stop closeness
  const s = v / 1000
  if (v < 60000) return `${s.toFixed(2)}s` // e.g. 12.45s
  const m = Math.floor(s / 60)
  const rem = s - m * 60
  return `${m}:${rem.toFixed(1).padStart(4, '0')}` // e.g. 1:15.0
}

// Format a leaderboard score for display. `suffix` mirrors the per-game config
// ('ms' for time boards, '%' for accuracy, '' for plain scores).
export function formatScore(score: number, suffix?: string): string {
  if (suffix === 'ms') return formatMs(score)
  return `${score}${suffix ?? ''}`
}
