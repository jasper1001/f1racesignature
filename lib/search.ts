import { GAMES } from '@/lib/games/registry'
import { ARTICLES } from '@/lib/articles'
import { FAQ_ITEMS } from '@/lib/faq'
import type { Driver, Race } from '@/lib/types'

// ── Site search index ───────────────────────────────────────────────────────────
// A single flat list of searchable "documents" spanning every kind of content on
// the site: top-level pages, mini-games, drivers, curated races, blog articles and
// FAQ answers. The static half (pages/games/articles/faq) is assembled at import
// time; drivers and races live in public JSON and are folded in client-side on
// first use (see SiteSearch). Kept framework-agnostic so it can be unit-reasoned
// about independently of the modal UI.

export type SearchGroup = 'Page' | 'Game' | 'Driver' | 'Race' | 'Article' | 'FAQ'

export interface SearchDoc {
  id: string
  group: SearchGroup
  title: string
  subtitle?: string
  href: string
  /** Extra searchable text that isn't displayed (bios, intros, tags…). */
  keywords: string
}

// Curated navigational destinations. Descriptions double as searchable keywords so
// e.g. "standings" finds the 2026 Season page and "export" finds the Studio.
const PAGES: SearchDoc[] = [
  { id: 'page-home', group: 'Page', title: 'Home', subtitle: 'F1 telemetry rendered as poster art', href: '/', keywords: 'landing homepage start' },
  { id: 'page-studio', group: 'Page', title: 'Studio', subtitle: 'Create your own F1 poster art', href: '/studio', keywords: 'create design export poster racing line speed heatmap sector split overtake theme' },
  { id: 'page-games', group: 'Page', title: 'Mini Games', subtitle: 'Free F1 games, quizzes and puzzles', href: '/games', keywords: 'play quiz puzzle daily wordle' },
  { id: 'page-drivers', group: 'Page', title: 'Drivers', subtitle: 'The F1 driver collection', href: '/drivers', keywords: 'legends champions grand prix winners' },
  { id: 'page-blog', group: 'Page', title: 'Blog', subtitle: 'F1 articles & analysis', href: '/blog', keywords: 'articles reading history technology circuits' },
  { id: 'page-garage', group: 'Page', title: 'My Garage', subtitle: 'Your saved posters', href: '/garage', keywords: 'saved collection favourites downloads' },
  { id: 'page-results', group: 'Page', title: '2026 Season', subtitle: 'Live standings, results & championship', href: '/results', keywords: 'standings constructors results championship live points' },
  { id: 'page-schedule', group: 'Page', title: 'Schedule', subtitle: '2026 race calendar & session times', href: '/schedule', keywords: 'calendar sessions times grand prix rounds' },
  { id: 'page-calendar', group: 'Page', title: 'Calendar', subtitle: 'Add the F1 season to your calendar', href: '/calendar', keywords: 'ics google calendar subscribe reminder' },
  { id: 'page-about', group: 'Page', title: 'About', subtitle: 'About F1RaceSignature', href: '/about', keywords: 'faq contact info story' },
]

/** The static half of the index — everything that ships in the bundle. */
export function staticSearchDocs(): SearchDoc[] {
  const games: SearchDoc[] = GAMES.map((g) => ({
    id: `game-${g.id}`,
    group: 'Game',
    title: g.title,
    subtitle: g.description,
    href: g.href,
    keywords: `${g.tag} ${g.blurb} ${g.badge ?? ''}`,
  }))

  const articles: SearchDoc[] = ARTICLES.map((a) => ({
    id: `article-${a.slug}`,
    group: 'Article',
    title: a.title,
    subtitle: a.description,
    href: `/blog/${a.slug}`,
    keywords: `${a.category} ${a.intro}`,
  }))

  const faqs: SearchDoc[] = FAQ_ITEMS.map((f, i) => ({
    id: `faq-${i}`,
    group: 'FAQ',
    title: f.q,
    subtitle: f.a,
    href: '/#faq-heading',
    keywords: f.a,
  }))

  return [...PAGES, ...games, ...articles, ...faqs]
}

/** Driver docs, built from the client-fetched drivers.json. */
export function driverDocs(drivers: Driver[]): SearchDoc[] {
  return drivers.map((d) => {
    const crown = d.championships > 0 ? ` · ${d.championships}× champion` : ''
    return {
      id: `driver-${d.id}`,
      group: 'Driver',
      title: d.name,
      subtitle: `${d.team} · ${d.nationality}${crown}`,
      href: `/drivers/${d.id}`,
      keywords: `${d.shortName} ${d.nationality} ${d.team} ${d.bio}`,
    }
  })
}

/** Race docs, built from the client-fetched races.json. */
export function raceDocs(races: Race[]): SearchDoc[] {
  return races.map((r) => ({
    id: `race-${r.id}`,
    group: 'Race',
    title: r.name,
    subtitle: `${r.circuitName} · ${r.location}`,
    href: `/race/${r.id}`,
    keywords: `${r.circuit} ${r.year} ${r.lapTime} ${r.description}`,
  }))
}

// Small nudge so navigational hits (pages/games) edge out prose (articles/faq)
// when scores are otherwise tied — keeps "results" landing on the Results page.
const GROUP_WEIGHT: Record<SearchGroup, number> = {
  Page: 4,
  Game: 3,
  Driver: 2,
  Race: 1,
  Article: 1,
  FAQ: 0,
}

function wordBoundaryHit(text: string, term: string): boolean {
  const i = text.indexOf(term)
  if (i < 0) return false
  return i === 0 || !/[a-z0-9]/.test(text[i - 1])
}

/**
 * Rank documents for a query. A doc must match *every* whitespace-separated term
 * somewhere (title, subtitle or keywords) to appear at all; per-term scoring
 * rewards title hits — exact > prefix > word-start > substring — over body hits.
 */
export function searchDocs(docs: SearchDoc[], query: string, limit = 30): SearchDoc[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/).filter(Boolean)

  const scored: { doc: SearchDoc; score: number }[] = []

  for (const doc of docs) {
    const title = doc.title.toLowerCase()
    const subtitle = (doc.subtitle ?? '').toLowerCase()
    const keywords = doc.keywords.toLowerCase()

    let score = 0
    let matchedAll = true

    for (const term of terms) {
      let termScore = 0
      if (title === term) termScore += 100
      else if (title.startsWith(term)) termScore += 60
      else if (wordBoundaryHit(title, term)) termScore += 40
      else if (title.includes(term)) termScore += 22
      if (subtitle.includes(term)) termScore += 8
      if (keywords.includes(term)) termScore += 4

      if (termScore === 0) {
        matchedAll = false
        break
      }
      score += termScore
    }

    if (!matchedAll) continue
    score += GROUP_WEIGHT[doc.group]
    scored.push({ doc, score })
  }

  scored.sort((a, b) => b.score - a.score || a.doc.title.length - b.doc.title.length)
  return scored.slice(0, limit).map((s) => s.doc)
}
