'use client'

import { create } from 'zustand'
import type { StudioState, VizMode, ArtTheme, ExportFormat } from './types'

interface StudioStore extends StudioState {
  // Compare (head-to-head) state
  compareEnabled: boolean
  compareDriverId: string | null
  compareRaceId: string | null

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
  setCompareRace: (raceId: string) => void
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
  compareRaceId: null,

  // Changing the primary race invalidates the compare lap (circuit may change)
  setDriver: (driverId) =>
    set({ selectedDriverId: driverId, selectedRaceId: null, compareRaceId: null, compareDriverId: null }),

  setRace: (raceId) => set({ selectedRaceId: raceId, compareRaceId: null, compareDriverId: null }),

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
      compareRaceId: null,
      compareDriverId: null,
    })),

  toggleCompare: () =>
    set((state) => ({
      compareEnabled: !state.compareEnabled,
      ...(state.compareEnabled ? { compareRaceId: null, compareDriverId: null } : {}),
    })),

  setCompareDriver: (compareDriverId) => set({ compareDriverId, compareRaceId: null }),

  setCompareRace: (compareRaceId) => set({ compareRaceId }),

  clearCompare: () =>
    set({ compareEnabled: false, compareRaceId: null, compareDriverId: null }),

  openUpgradeModal: (reason) =>
    set({ showUpgradeModal: true, upgradeModalReason: reason }),

  closeUpgradeModal: () =>
    set({ showUpgradeModal: false, upgradeModalReason: null }),
}))
