'use client'

import { create } from 'zustand'
import type { StudioState, VizMode, ArtTheme, ExportFormat } from './types'

// Up to this many extra laps can be compared against the main lap (so 3 total).
export const MAX_COMPARE = 2

interface StudioStore extends StudioState {
  // Compare (head-to-head) state
  compareEnabled: boolean
  compareDriverId: string | null
  compareRaceIds: string[]

  setDriver: (driverId: string) => void
  setRace: (raceId: string) => void
  setVizMode: (mode: VizMode) => void
  setTheme: (theme: ArtTheme) => void
  setExportFormat: (format: ExportFormat) => void
  applyConfig: (config: {
    driverId?: string
    raceId?: string
    vizMode?: VizMode
    theme?: ArtTheme
  }) => void
  toggleCompare: () => void
  setCompareDriver: (driverId: string) => void
  toggleCompareRace: (raceId: string) => void
  clearCompare: () => void
  openUpgradeModal: (reason: string) => void
  closeUpgradeModal: () => void
}

export const useStudioStore = create<StudioStore>((set) => ({
  selectedDriverId: 'hamilton',
  selectedRaceId: 'hamilton_silverstone_2020',
  vizMode: 'racing_line',
  theme: 'carbon_fiber',
  exportFormat: 'poster_portrait',
  showUpgradeModal: false,
  upgradeModalReason: null,

  compareEnabled: false,
  compareDriverId: null,
  compareRaceIds: [],

  // Changing the primary race invalidates the compare laps (circuit may change)
  setDriver: (driverId) =>
    set({ selectedDriverId: driverId, selectedRaceId: null, compareRaceIds: [], compareDriverId: null }),

  setRace: (raceId) => set({ selectedRaceId: raceId, compareRaceIds: [], compareDriverId: null }),

  setVizMode: (vizMode) => set({ vizMode }),

  setTheme: (theme) => set({ theme }),

  setExportFormat: (exportFormat) => set({ exportFormat }),

  applyConfig: ({ driverId, raceId, vizMode, theme }) =>
    set((state) => ({
      selectedDriverId: driverId ?? state.selectedDriverId,
      selectedRaceId: raceId ?? state.selectedRaceId,
      vizMode: vizMode ?? state.vizMode,
      theme: theme ?? state.theme,
      compareEnabled: false,
      compareRaceIds: [],
      compareDriverId: null,
    })),

  toggleCompare: () =>
    set((state) => ({
      compareEnabled: !state.compareEnabled,
      ...(state.compareEnabled ? { compareRaceIds: [], compareDriverId: null } : {}),
    })),

  setCompareDriver: (compareDriverId) => set({ compareDriverId, compareRaceIds: [] }),

  // Add the lap if room (≤ MAX_COMPARE), remove it if already selected.
  toggleCompareRace: (raceId) =>
    set((state) => {
      if (state.compareRaceIds.includes(raceId)) {
        return { compareRaceIds: state.compareRaceIds.filter((id) => id !== raceId) }
      }
      if (state.compareRaceIds.length >= MAX_COMPARE) return {}
      return { compareRaceIds: [...state.compareRaceIds, raceId] }
    }),

  clearCompare: () =>
    set({ compareEnabled: false, compareRaceIds: [], compareDriverId: null }),

  openUpgradeModal: (reason) =>
    set({ showUpgradeModal: true, upgradeModalReason: reason }),

  closeUpgradeModal: () =>
    set({ showUpgradeModal: false, upgradeModalReason: null }),
}))
