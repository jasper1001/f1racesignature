// A simple per-day cap on how many posters/replays a visitor can download or
// export. This is intentionally not a freemium gate — just a soft, client-side
// guard tracked in localStorage. Poster PNG exports and MP4 replay downloads
// share the same daily budget.

export const DAILY_DOWNLOAD_LIMIT = 4

const STORAGE_KEY = 'rs_download_count'

function today(): string {
  // Local-date key (YYYY-MM-DD) so the count resets at the visitor's midnight.
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function read(): { date: string; count: number } {
  if (typeof window === 'undefined') return { date: today(), count: 0 }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { date: string; count: number }
      if (parsed.date === today()) return parsed
    }
  } catch {
    // Corrupt/blocked storage — treat as a fresh day.
  }
  return { date: today(), count: 0 }
}

/** How many downloads/exports the visitor has left today (0..LIMIT). */
export function remainingDownloads(): number {
  return Math.max(0, DAILY_DOWNLOAD_LIMIT - read().count)
}

/** True if the visitor can still download/export today. */
export function canDownload(): boolean {
  return remainingDownloads() > 0
}

/** Record one successful download/export against today's budget. */
export function recordDownload(): void {
  if (typeof window === 'undefined') return
  const current = read()
  const next = { date: today(), count: current.count + 1 }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable — silently skip; the cap just won't persist.
  }
}
