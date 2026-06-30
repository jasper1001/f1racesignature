'use client'

// ── Livery Designer: data model, presets and persistence ────────────────────────
// A "design" is a small JSON blob describing the colours, finish, pattern and
// markings of the F1 car. It is rendered in 3D by <F1Car> and saved to
// localStorage so the user's garage of designs survives reloads.

export type Finish = 'matte' | 'gloss' | 'metallic'
export type Pattern = 'none' | 'stripe' | 'flames' | 'carbon' | 'checker' | 'chevron' | 'fade' | 'hex' | 'camo' | 'bolt'

export interface LiveryColors {
  body: string
  nose: string
  wings: string
  sidepods: string
  halo: string
  rims: string
  accent: string
}

export interface LiveryDesign {
  colors: LiveryColors
  finish: Finish
  pattern: Pattern
  number: string
  name: string
}

// Human-readable labels for each paintable zone (drives the control panel).
export const ZONE_LABELS: { key: keyof LiveryColors; label: string }[] = [
  { key: 'body', label: 'Body' },
  { key: 'nose', label: 'Nose' },
  { key: 'wings', label: 'Wings' },
  { key: 'sidepods', label: 'Sidepods' },
  { key: 'halo', label: 'Halo' },
  { key: 'rims', label: 'Wheel Rims' },
  { key: 'accent', label: 'Number / Trim' },
]

export const FINISHES: { key: Finish; label: string }[] = [
  { key: 'gloss', label: 'Gloss' },
  { key: 'matte', label: 'Matte' },
  { key: 'metallic', label: 'Metallic' },
]

export const PATTERNS: { key: Pattern; label: string }[] = [
  { key: 'none', label: 'Solid' },
  { key: 'stripe', label: 'Stripes' },
  { key: 'fade', label: 'Fade' },
  { key: 'carbon', label: 'Carbon' },
  { key: 'checker', label: 'Chequered' },
  { key: 'chevron', label: 'Chevrons' },
  { key: 'hex', label: 'Hexagons' },
  { key: 'flames', label: 'Flames' },
  { key: 'camo', label: 'Camo' },
  { key: 'bolt', label: 'Lightning' },
]

export const DEFAULT_DESIGN: LiveryDesign = {
  colors: {
    body: '#d11e2a',
    nose: '#d11e2a',
    wings: '#161616',
    sidepods: '#d11e2a',
    halo: '#161616',
    rims: '#e8c64a',
    accent: '#ffffff',
  },
  finish: 'gloss',
  pattern: 'none',
  number: '16',
  name: 'YOU',
}

// ── Team-inspired presets ───────────────────────────────────────────────────────
export interface Preset {
  id: string
  label: string
  design: LiveryDesign
}

export const PRESETS: Preset[] = [
  {
    id: 'scarlet',
    label: 'Scarlet',
    design: {
      colors: { body: '#d40000', nose: '#d40000', wings: '#1a1a1a', sidepods: '#d40000', halo: '#1a1a1a', rims: '#e8c64a', accent: '#ffffff' },
      finish: 'gloss', pattern: 'none', number: '16', name: 'SF',
    },
  },
  {
    id: 'papaya',
    label: 'Papaya',
    design: {
      colors: { body: '#ff8000', nose: '#ff8000', wings: '#2b2b2b', sidepods: '#ff8000', halo: '#2b2b2b', rims: '#0090d0', accent: '#0090d0' },
      finish: 'gloss', pattern: 'none', number: '4', name: 'MCL',
    },
  },
  {
    id: 'silver',
    label: 'Silver Arrow',
    design: {
      colors: { body: '#1c1c20', nose: '#1c1c20', wings: '#00d2be', sidepods: '#c8ccd0', halo: '#00d2be', rims: '#c8ccd0', accent: '#00d2be' },
      finish: 'metallic', pattern: 'none', number: '63', name: 'AMG',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    design: {
      colors: { body: '#0a1a4f', nose: '#0a1a4f', wings: '#d6021a', sidepods: '#0a1a4f', halo: '#1a1a1a', rims: '#e8c64a', accent: '#e8c64a' },
      finish: 'gloss', pattern: 'none', number: '1', name: 'RB',
    },
  },
  {
    id: 'brg',
    label: 'Racing Green',
    design: {
      colors: { body: '#00594f', nose: '#00594f', wings: '#1a1a1a', sidepods: '#00594f', halo: '#cddc39', rims: '#cddc39', accent: '#cddc39' },
      finish: 'gloss', pattern: 'none', number: '14', name: 'AMR',
    },
  },
  {
    id: 'carbon',
    label: 'Carbon',
    design: {
      colors: { body: '#23252b', nose: '#23252b', wings: '#0e0e10', sidepods: '#23252b', halo: '#0e0e10', rims: '#8a8f99', accent: '#e6b422' },
      finish: 'matte', pattern: 'carbon', number: '00', name: 'GT', },
  },
  {
    id: 'inferno',
    label: 'Inferno',
    design: {
      colors: { body: '#111111', nose: '#111111', wings: '#111111', sidepods: '#111111', halo: '#111111', rims: '#ff5500', accent: '#ff7a00' },
      finish: 'gloss', pattern: 'flames', number: '7', name: 'BLZ',
    },
  },
  {
    id: 'stripes',
    label: 'Le Mans',
    design: {
      colors: { body: '#f4f4f4', nose: '#f4f4f4', wings: '#1a3aa8', sidepods: '#f4f4f4', halo: '#1a3aa8', rims: '#1a3aa8', accent: '#d6021a' },
      finish: 'gloss', pattern: 'stripe', number: '2', name: 'LM',
    },
  },
]

// ── Persistence ─────────────────────────────────────────────────────────────────
export interface SavedLivery {
  id: string
  design: LiveryDesign
  savedAt: number
  /** data: URL thumbnail captured from the canvas at save time */
  thumb?: string
}

const KEY = 'f1rs_livery_garage_v1'

export function getLiveries(): SavedLivery[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedLivery[]
  } catch {
    return []
  }
}

function write(items: SavedLivery[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('livery-garage-changed'))
}

export function saveLivery(design: LiveryDesign, thumb?: string): SavedLivery {
  const entry: SavedLivery = { id: `livery-${Date.now()}`, design, savedAt: Date.now(), thumb }
  // Cap the garage so localStorage never balloons with base64 thumbnails.
  write([entry, ...getLiveries()].slice(0, 24))
  return entry
}

export function removeLivery(id: string) {
  write(getLiveries().filter((l) => l.id !== id))
}

export function sanitizeMarking(s: string, max: number): string {
  return s.replace(/[^A-Za-z0-9 ]/g, '').slice(0, max).toUpperCase()
}
