'use client'

import { create } from 'zustand'
import type { StudioState, VizMode, ArtTheme, ExportFormat } from './types'

interface StudioStore extends StudioState {
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

  setDriver: (driverId) =>
    set({ selectedDriverId: driverId, selectedRaceId: null }),

  setRace: (raceId) => set({ selectedRaceId: raceId }),

  setVizMode: (vizMode) => set({ vizMode }),

  setTheme: (theme) => set({ theme }),

  setExportFormat: (exportFormat) => set({ exportFormat }),

  applyConfig: ({ driverId, raceId, vizMode, theme }) =>
    set((state) => ({
      selectedDriverId: driverId ?? state.selectedDriverId,
      selectedRaceId: raceId ?? state.selectedRaceId,
      vizMode: vizMode ?? state.vizMode,
      theme: theme ?? state.theme,
    })),

  openUpgradeModal: (reason) =>
    set({ showUpgradeModal: true, upgradeModalReason: reason }),

  closeUpgradeModal: () =>
    set({ showUpgradeModal: false, upgradeModalReason: null }),
}))
