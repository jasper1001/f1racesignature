// Site-wide constants. Safe to import from both server and client code —
// keep this module free of any server-only APIs.

export const SITE_URL = 'https://f1racesignature.site'

/** Single contact inbox shown on About/Privacy/Terms/Cookies and in schema.org data. */
export const CONTACT_EMAIL = 'wayfarerwondersblog@gmail.com'

/**
 * The current F1 season. Bump once a year — everything (nav labels, metadata,
 * API queries) derives from this.
 */
export const SEASON = '2026'
