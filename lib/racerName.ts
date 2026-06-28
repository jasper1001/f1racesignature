// Reddit-style random racer names built only from curated word lists, so a
// player can never type free text into the leaderboard — bad words become
// structurally impossible, not just filtered. Deliberately avoids real driver
// and team names (those have their own dropdowns and would be confusing here).

const ADJECTIVES = [
  'Turbo', 'Nitro', 'Slick', 'Rapid', 'Blazing', 'Flying', 'Bold', 'Swift',
  'Fierce', 'Mighty', 'Lightning', 'Roaring', 'Charging', 'Boosted', 'Hybrid',
  'Sideways', 'Greasy', 'Gritty', 'Howling', 'Screaming', 'Reckless', 'Fearless',
  'Smooth', 'Sharp', 'Wild', 'Furious', 'Electric', 'Sonic', 'Flat-Out', 'Late',
]

const NOUNS = [
  'Apex', 'Piston', 'Chicane', 'Slipstream', 'Throttle', 'Hairpin', 'Kerb',
  'Diffuser', 'Gearbox', 'Paddock', 'Podium', 'Rocket', 'Comet', 'Bullet',
  'Wrench', 'Marshal', 'Rookie', 'Ace', 'Charger', 'Drifter', 'Burner',
  'Screamer', 'Backmarker', 'Pitlane', 'Redline', 'Downforce', 'Tyre', 'Halo',
  'Overcut', 'Undercut',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** e.g. "TurboApex_47". Always letters + an underscore + 1-2 digits. */
export function generateRacerName(): string {
  return `${pick(ADJECTIVES)}${pick(NOUNS)}_${Math.floor(Math.random() * 99) + 1}`
}

/**
 * True if `name` is a valid generated racer name (curated adjective + noun + _NN).
 * Used to migrate returning players off old free-text names — the server now
 * rejects anything that isn't one of these (see migration 005).
 */
export function isRacerName(name: string): boolean {
  const m = /^([A-Za-z-]+)_\d{1,2}$/.exec(name)
  if (!m) return false
  const prefix = m[1]
  return ADJECTIVES.some((a) => prefix.startsWith(a) && NOUNS.includes(prefix.slice(a.length)))
}
