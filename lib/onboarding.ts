'use client'

const PREFIX = 'f1rs_seen_'

export function hasSeen(key: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(PREFIX + key) === '1'
  } catch {
    return true
  }
}

export function markSeen(key: string) {
  try {
    localStorage.setItem(PREFIX + key, '1')
  } catch {
    // ignore (private mode etc.)
  }
}
