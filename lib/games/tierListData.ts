// ── Tier list ("Rank 'Em") subjects ─────────────────────────────────────────────
// Pure opinion game — no scoring. Each subject is a small pool of items the player
// drags into S–D tiers, then shares. Kept evergreen (no roster-date claims).

export interface TierItem {
  id: string
  label: string
}

export interface TierSubject {
  id: string
  label: string
  emoji: string
  items: TierItem[]
}

export interface TierDef {
  id: string
  color: string
  /** Text colour on the coloured label cell */
  text: string
}

export const TIERS: TierDef[] = [
  { id: 'S', color: '#ef4444', text: '#ffffff' },
  { id: 'A', color: '#f97316', text: '#ffffff' },
  { id: 'B', color: '#eab308', text: '#1a1712' },
  { id: 'C', color: '#22c55e', text: '#ffffff' },
  { id: 'D', color: '#3b82f6', text: '#ffffff' },
]

export const POOL_ID = 'pool'

function item(id: string, label: string): TierItem {
  return { id, label }
}

export const SUBJECTS: TierSubject[] = [
  {
    id: 'active-drivers',
    label: 'Active & Recent Drivers',
    emoji: '🏎️',
    items: [
      // The stars…
      item('verstappen', 'Verstappen'), item('hamilton', 'Hamilton'), item('leclerc', 'Leclerc'),
      item('norris', 'Norris'), item('russell', 'Russell'), item('piastri', 'Piastri'),
      item('sainz', 'Sainz'), item('alonso', 'Alonso'),
      // …and the rest of the grid (rank 'em how you really feel 😏)
      item('perez', 'Pérez'), item('gasly', 'Gasly'), item('ocon', 'Ocon'), item('albon', 'Albon'),
      item('hulkenberg', 'Hülkenberg'), item('tsunoda', 'Tsunoda'), item('bottas', 'Bottas'),
      item('stroll', 'Stroll'), item('magnussen', 'Magnussen'), item('zhou', 'Zhou'),
    ],
  },
  {
    id: 'all-time',
    label: 'All-Time Legends',
    emoji: '👑',
    items: [
      item('senna', 'Senna'), item('schumacher', 'Schumacher'), item('hamilton', 'Hamilton'),
      item('fangio', 'Fangio'), item('prost', 'Prost'), item('clark', 'Clark'),
      item('stewart', 'Stewart'), item('lauda', 'Lauda'), item('verstappen', 'Verstappen'),
      item('vettel', 'Vettel'), item('alonso', 'Alonso'), item('moss', 'Moss'),
    ],
  },
  {
    id: 'teams',
    label: 'F1 Teams',
    emoji: '🏁',
    items: [
      // Current grid
      item('red-bull', 'Red Bull'), item('ferrari', 'Ferrari'), item('mercedes', 'Mercedes'),
      item('mclaren', 'McLaren'), item('aston', 'Aston Martin'), item('alpine', 'Alpine'),
      item('williams', 'Williams'), item('haas', 'Haas'), item('sauber', 'Sauber'),
      item('rb', 'RB'),
      // Iconic past constructors
      item('lotus', 'Lotus'), item('brabham', 'Brabham'), item('tyrrell', 'Tyrrell'),
      item('benetton', 'Benetton'), item('renault', 'Renault'), item('jordan', 'Jordan'),
      item('brawn', 'Brawn'), item('toro-rosso', 'Toro Rosso'), item('force-india', 'Force India'),
      item('minardi', 'Minardi'),
    ],
  },
  {
    id: 'circuits',
    label: 'Iconic Circuits',
    emoji: '🗺️',
    items: [
      item('monaco', 'Monaco'), item('spa', 'Spa'), item('suzuka', 'Suzuka'),
      item('silverstone', 'Silverstone'), item('monza', 'Monza'), item('interlagos', 'Interlagos'),
      item('cota', 'Austin'), item('zandvoort', 'Zandvoort'), item('jeddah', 'Jeddah'),
      item('vegas', 'Las Vegas'), item('baku', 'Baku'), item('singapore', 'Singapore'),
    ],
  },
]
