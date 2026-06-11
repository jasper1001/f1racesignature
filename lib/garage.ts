'use client'

import type { VizMode, ArtTheme } from './types'

export interface SavedPoster {
  id: string // unique key
  driverId: string
  raceId: string
  theme: ArtTheme
  vizMode: VizMode
  driverName: string
  raceName: string
  savedAt: number
}

const KEY = 'f1rs_garage_v1'

export function getGarage(): SavedPoster[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedPoster[]
  } catch {
    return []
  }
}

function write(items: SavedPoster[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('garage-changed'))
}

export function isSaved(driverId: string, raceId: string, theme: string, vizMode: string): boolean {
  return getGarage().some(
    (p) => p.driverId === driverId && p.raceId === raceId && p.theme === theme && p.vizMode === vizMode,
  )
}

export function toggleSave(poster: Omit<SavedPoster, 'id' | 'savedAt'>): boolean {
  const items = getGarage()
  const match = (p: SavedPoster) =>
    p.driverId === poster.driverId && p.raceId === poster.raceId && p.theme === poster.theme && p.vizMode === poster.vizMode
  const existing = items.find(match)
  if (existing) {
    write(items.filter((p) => !match(p)))
    return false
  }
  const entry: SavedPoster = { ...poster, id: `${poster.raceId}-${poster.vizMode}-${poster.theme}-${Date.now()}`, savedAt: Date.now() }
  write([entry, ...items])
  return true
}

export function removeFromGarage(id: string) {
  write(getGarage().filter((p) => p.id !== id))
}
