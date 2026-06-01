import type { VizMode, ArtTheme, ExportFormat } from './types'

// All unlocked for testing
export const isDriverFree = (_driverId: string): boolean => true
export const isRaceFree = (_raceId: string): boolean => true
export const isVizModeFree = (_mode: VizMode): boolean => true
export const isThemeFree = (_theme: ArtTheme): boolean => true
export const isExportFree = (_format: ExportFormat): boolean => true

export const UPGRADE_REASONS: Record<string, string> = {
  driver: 'Unlock all 8 legendary drivers — Schumacher, Senna, Prost, Lauda, Alonso, and Vettel.',
  race: 'Access the full library of iconic race performances.',
  vizMode: 'Unlock Sector Split, Overtake Map, Lap Delta, and Championship Run visualizations.',
  theme: 'Access all 8 artistic themes — Neon Racing, Blueprint, Monaco Night, and more.',
  exportFormat: 'Export as Instagram square, desktop wallpaper, mobile wallpaper, and race card.',
}
