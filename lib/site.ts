// Site-wide constants. Safe to import from both server and client code —
// keep this module free of any server-only APIs.

export const SITE_URL = 'https://f1racesignature.site'

/** Single contact inbox shown on About/Privacy/Terms/Cookies and in schema.org data. */
export const CONTACT_EMAIL = 'wayfarerwondersblog@gmail.com'

/**
 * The current F1 season — derived automatically from the calendar year.
 *
 * The season and the calendar year line up (races run Mar–Dec), so the current
 * year is the active season for all of it, and it rolls over to the new season
 * each January — by which point the F1 API's schedule for the new year has been
 * published. Everything (nav labels, metadata, API queries) derives from this,
 * so no yearly code change is needed.
 *
 * Kept as the current year (not rolled forward in December) on purpose: it keeps
 * the just-completed championship standings visible through the off-season.
 *
 * Escape hatch: set NEXT_PUBLIC_F1_SEASON to pin a specific year (e.g. if the API
 * is slow to publish a new calendar in early January).
 */
export const SEASON = process.env.NEXT_PUBLIC_F1_SEASON || String(new Date().getUTCFullYear())
