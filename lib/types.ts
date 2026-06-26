export interface Driver {
  id: string
  name: string
  shortName: string
  team: string
  nationality: string
  color: string
  isFree: boolean
  championships: number
  bio: string
}

export interface Race {
  id: string
  driverId: string
  name: string
  circuit: string
  circuitName: string
  year: number
  location: string
  lapTime: string
  description: string
  isFree: boolean
  telemetryFile: string
}

export interface TelemetryPoint {
  x: number
  y: number
  speed: number
  sector: 1 | 2 | 3
  throttle: number
  brake: number
  distance: number
}

export interface Telemetry {
  driverId: string
  raceId: string
  lapTime: string
  sectors: {
    s1Time: number
    s2Time: number
    s3Time: number
  }
  topSpeed: number
  averageSpeed: number
  benchmarkLapTime: string
  championshipPoints: number[]
  points: TelemetryPoint[]
}

export interface Circuit {
  id: string
  name: string
  location: string
  lapLength: number
  corners: number
  drsZones: number
  viewBox: string
  path: string
  sector1End: number
  sector2End: number
}

export type VizMode =
  | 'racing_line'
  | 'racing_line_real'
  | 'speed_heatmap'
  | 'sector_split'
  | 'overtake_map'

// Real circuit centreline (from OpenStreetMap), in the same 500x420 PATH space as
// Circuit.path, so the actual racing line can be overlaid on a true track surface.
export interface TrackCenterline {
  id: string
  source: string
  viewBox: string
  perimeterM: number
  lapLengthM: number
  alignRmsNorm: number
  // Track width in PATH units (≈15 m), for drawing the asphalt ribbon to scale.
  widthPath: number
  centerlinePath: string
}

export type ArtTheme =
  | 'carbon_fiber'
  | 'championship_gold'
  | 'neon_racing'
  | 'blueprint'
  | 'monaco_night'
  | 'helmet_cam'
  | 'british_racing_green'
  | 'carbon_mono'
  | 'ferrari_rosso'
  | 'mercedes_silver'
  | 'mclaren_papaya'
  | 'redbull_midnight'
  | 'gallery_print'

export type ThemeTexture = 'none' | 'carbon' | 'grain' | 'paper' | 'grid'

export type ExportFormat =
  | 'poster_portrait'
  | 'square_instagram'
  | 'desktop_wallpaper'
  | 'mobile_wallpaper'
  | 'race_card'

export interface ThemeConfig {
  id: ArtTheme
  name: string
  bg: string
  bgSecondary: string
  primaryLine: string
  fastColor: string
  slowColor: string
  midColor: string
  textColor: string
  textDim: string
  accentGlow: string
  borderColor: string
  s1Color: string
  s2Color: string
  s3Color: string
  isFree: boolean
  // Surface texture overlaid on the poster background.
  texture: ThemeTexture
  // CSS font-family for the large display title (driver name / hero).
  displayFont: string
}

export interface VizModeConfig {
  id: VizMode
  name: string
  description: string
  isFree: boolean
}

export interface ExportFormatConfig {
  id: ExportFormat
  name: string
  width: number
  height: number
  isFree: boolean
}

export interface GalleryItem {
  id: string
  title: string
  subtitle: string
  driverId: string
  raceId: string
  circuitId: string
  driverColor: string
  theme: ArtTheme
  vizMode: VizMode
  isPremium: boolean
  badge?: string
}

export interface StudioState {
  selectedDriverId: string | null
  selectedRaceId: string | null
  vizMode: VizMode
  theme: ArtTheme
  exportFormat: ExportFormat
  showUpgradeModal: boolean
  upgradeModalReason: string | null
}
