// Affiliate products — official F1 team merch on Amazon, shown ad-style across the
// site (think Google Ads slots, but hand-curated). Each entry is a single product.
//
// Revenue model: `affiliateUrl` is an Amazon short link (amzn.to) carrying our
// Associates tag. Clicks are tracked via our own `id` so we can attribute
// impressions/clicks without depending on Amazon's reporting alone.
//
// Conventions:
//  - `id`        our own stable product id. Format: <team>-<type>-<nnn> (kebab).
//                Never reuse or renumber an id once it has shipped (analytics rely on it).
//  - `team`      kebab-case team slug. Keep in sync with display names in driverTeams.ts.
//  - `type`      the product noun (Hat, Cap, T-Shirt, Hoodie, Mug, Keychain, ...).
//  - `category`  broad bucket used for filtering/placement (see ProductCategory).
//  - `affiliateUrl` Amazon Associates short link (amzn.to/...).
//  - `imageUrl`  Amazon CDN image (m.media-amazon.com/...).
//  - `enabled`   flip to false to pull a product without deleting its history.

export type ProductCategory =
  | 'Wearables'
  | 'Fashion'
  | 'Accessories'
  | 'Home & Office'
  | 'Collectibles'
  | 'Model Cars'

export interface AffiliateProduct {
  /** Our own product id — stable, never reused. */
  id: string
  /** Kebab-case team slug. */
  team: string
  /** Product type / noun, e.g. "Hat". */
  type: string
  /** Broad category bucket for filtering and ad placement. */
  category: ProductCategory
  /** Amazon Associates short link. */
  affiliateUrl: string
  /** Product image (Amazon CDN). */
  imageUrl: string
  /** Set false to hide without losing the id/analytics history. */
  enabled: boolean
}

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  // ── Red Bull Racing ────────────────────────────────────────────────────────
  {
    id: 'red-bull-racing-hat-001',
    team: 'red-bull-racing',
    type: 'Hat',
    category: 'Wearables',
    affiliateUrl: 'https://amzn.to/3SOi3gE',
    imageUrl: 'https://m.media-amazon.com/images/I/61h34GJWudL._AC_SX679_.jpg',
    enabled: true,
  },
  {
    id: 'red-bull-racing-toy-001',
    team: 'red-bull-racing',
    type: 'Toy',
    category: 'Collectibles',
    affiliateUrl: 'https://amzn.to/4eMNuiF',
    imageUrl: 'https://m.media-amazon.com/images/I/61Q-OJCHOfL._AC_SX679_.jpg',
    enabled: true,
  },
  {
    id: 'red-bull-racing-toy-002',
    team: 'red-bull-racing',
    type: 'Toy',
    category: 'Collectibles',
    affiliateUrl: 'https://amzn.to/3T8xwIv',
    imageUrl: 'https://m.media-amazon.com/images/I/718Awlob4IL._AC_SX679_.jpg',
    enabled: true,
  },

  // ── Ferrari ────────────────────────────────────────────────────────────────
  {
    id: 'ferrari-hat-001',
    team: 'ferrari',
    type: 'Hat',
    category: 'Wearables',
    affiliateUrl: 'https://amzn.to/4eQ13hB',
    imageUrl: 'https://m.media-amazon.com/images/I/71K4bQOCqSL._AC_SX679_.jpg',
    enabled: true,
  },
  {
    id: 'ferrari-toy-001',
    team: 'ferrari',
    type: 'Toy',
    category: 'Collectibles',
    affiliateUrl: 'https://amzn.to/4fa3Tiw',
    imageUrl: 'https://m.media-amazon.com/images/I/61RVcfh6zaL._AC_SX679_.jpg',
    enabled: true,
  },
  {
    id: 'ferrari-tshirt-001',
    team: 'ferrari',
    type: 'T-Shirt',
    category: 'Fashion',
    affiliateUrl: 'https://amzn.to/44lBAb3',
    imageUrl: 'https://m.media-amazon.com/images/I/61pVqdcIhZL._AC_SX679_.jpg',
    enabled: true,
  },

  // ── McLaren ────────────────────────────────────────────────────────────────
  {
    id: 'mclaren-toy-001',
    team: 'mclaren',
    type: 'Toy',
    category: 'Collectibles',
    affiliateUrl: 'https://amzn.to/43XzjCC',
    imageUrl: 'https://m.media-amazon.com/images/I/71u0+pxhtOL._AC_SX679_.jpg',
    enabled: true,
  },

  // ── Mercedes ───────────────────────────────────────────────────────────────
  {
    id: 'mercedes-toy-001',
    team: 'mercedes',
    type: 'Toy',
    category: 'Collectibles',
    affiliateUrl: 'https://amzn.to/4xVBoMS',
    imageUrl: 'https://m.media-amazon.com/images/I/71U3eRb0M5L._AC_SX679_.jpg',
    enabled: true,
  },
  {
    id: 'mercedes-jacket-001',
    team: 'mercedes',
    type: 'Jacket',
    category: 'Fashion',
    affiliateUrl: 'https://amzn.to/3QvKbVg',
    imageUrl: 'https://m.media-amazon.com/images/I/618aCJo+meL._AC_SX679_.jpg',
    enabled: true,
  },
]

/**
 * Display label + accent color per team slug, for rendering badges on the shelf.
 * Colors mirror the team themes in themes.ts. Add a row when you add a team.
 */
export const TEAM_META: Record<string, { label: string; color: string }> = {
  'red-bull-racing': { label: 'Red Bull Racing', color: '#1e41ff' },
  ferrari: { label: 'Ferrari', color: '#dc0000' },
  mercedes: { label: 'Mercedes', color: '#00d2be' },
  mclaren: { label: 'McLaren', color: '#ff8000' },
  'aston-martin': { label: 'Aston Martin', color: '#229971' },
}

/** Pretty team label, falling back to a title-cased slug. */
export const teamLabel = (slug: string): string =>
  TEAM_META[slug]?.label ??
  slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

/** All enabled products, optionally filtered by team slug and/or category. */
export function getAffiliateProducts(opts?: {
  team?: string
  category?: ProductCategory
}): AffiliateProduct[] {
  return AFFILIATE_PRODUCTS.filter(
    (p) =>
      p.enabled &&
      (!opts?.team || p.team === opts.team) &&
      (!opts?.category || p.category === opts.category),
  )
}

export const productById = (id: string): AffiliateProduct | undefined =>
  AFFILIATE_PRODUCTS.find((p) => p.id === id)

/**
 * Randomly pick up to `count` distinct enabled products (optionally filtered).
 * Uses Math.random, so call it on the client (e.g. in a useEffect) to keep
 * server-rendered markup stable and avoid hydration mismatches.
 */
export function pickRandomProducts(
  count = 1,
  opts?: { team?: string; category?: ProductCategory; exclude?: string[] },
): AffiliateProduct[] {
  const pool = getAffiliateProducts(opts).filter(
    (p) => !opts?.exclude?.includes(p.id),
  )
  // Fisher–Yates shuffle, then take the first `count`.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

/** Randomly pick a single enabled product, or null if none match. */
export const pickRandomProduct = (opts?: {
  team?: string
  category?: ProductCategory
  exclude?: string[]
}): AffiliateProduct | null => pickRandomProducts(1, opts)[0] ?? null
