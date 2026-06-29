declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-HVKDBEVYBD'

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', eventName, {
    ...(GA_MEASUREMENT_ID && { send_to: GA_MEASUREMENT_ID }),
    ...params,
  })
}

export const Analytics = {
  driverSelected: (driverId: string) =>
    trackEvent('driver_selected', { driver_id: driverId }),

  raceSelected: (raceId: string) =>
    trackEvent('race_selected', { race_id: raceId }),

  vizModeChanged: (mode: string) =>
    trackEvent('viz_mode_changed', { viz_mode: mode }),

  themeChanged: (theme: string) =>
    trackEvent('theme_changed', { theme }),

  exportFormatChanged: (format: string) =>
    trackEvent('export_format_changed', { format }),

  exportClicked: (format: string, driverId: string, raceId: string) =>
    trackEvent('export_clicked', { format, driver_id: driverId, race_id: raceId }),

  // Conversion: fires only after the poster PNG actually downloads
  exportCompleted: (format: string, driverId: string, raceId: string) =>
    trackEvent('export_completed', { format, driver_id: driverId, race_id: raceId }),

  upgradeModalOpened: (reason: string) =>
    trackEvent('upgrade_modal_opened', { reason }),

  galleryItemClicked: (itemId: string) =>
    trackEvent('gallery_item_clicked', { item_id: itemId }),

  compareToggled: (enabled: boolean) =>
    trackEvent('compare_toggled', { enabled }),

  surpriseMe: () => trackEvent('surprise_me'),

  shareClicked: (method: string) => trackEvent('share_clicked', { method }),

  lapPlayed: () => trackEvent('lap_played'),

  posterSaved: (raceId: string) => trackEvent('poster_saved', { race_id: raceId }),

  studioOpened: () => trackEvent('studio_opened'),

  pageViewed: (page: string) => trackEvent('page_view', { page_path: page }),

  // Generic UI click — fired by the global ClickTracker for any button/link
  uiClick: (params: {
    label: string
    element: string
    href?: string
    section?: string
    page: string
  }) => trackEvent('ui_click', params),

  // ── Higher or Lower game ──────────────────────────────────────────────────
  hlGameStarted: () =>
    trackEvent('hl_game_started'),

  hlGuessSubmitted: (stat: string, correct: boolean, streak: number) =>
    trackEvent('hl_guess_submitted', { stat, correct, streak }),

  hlGameOver: (finalStreak: number, bestStreak: number) =>
    trackEvent('hl_game_over', { final_streak: finalStreak, best_streak: bestStreak }),

  hlShareClicked: (streak: number) =>
    trackEvent('hl_share_clicked', { streak }),

  hlPlayAgain: () =>
    trackEvent('hl_play_again'),

  // ── Affiliate shelf (Amazon merch) ────────────────────────────────────────
  // Conversion-intent click on a product → Amazon. `product_id` is our own id
  // from affiliateProducts.ts so we can attribute without Amazon's reporting.
  affiliateClicked: (params: {
    productId: string
    team: string
    type: string
    placement: string
  }) =>
    trackEvent('affiliate_click', {
      product_id: params.productId,
      team: params.team,
      type: params.type,
      placement: params.placement,
    }),
}
