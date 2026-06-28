// Podium Scramble — players reorder a shuffled rostrum (P1–P3) for a famous race.
// Score = total positions off across the game (lower wins); elapsed time folds in
// as a sub-1 fractional tiebreak so two perfect runs can still be separated.
//
// Every podium below is the FINAL classification (post-penalty) and is intentionally
// chosen to be unambiguous and memorable. Keep this list factual.

export interface PodiumEntry {
  driver: string
  team: string
}

export interface PodiumRace {
  id: string
  gp: string
  year: number
  /** One-line hook shown on the reveal. */
  note: string
  /** Correct order: index 0 = P1, 1 = P2, 2 = P3. */
  podium: [PodiumEntry, PodiumEntry, PodiumEntry]
}

export const ROUNDS_PER_GAME = 6

// Time tiebreak: total elapsed across the game is capped and squeezed into [0,1)
// so it never outweighs a single position. CAP = 5 minutes of total thinking.
export const TIME_CAP_MS = 300_000

export const PODIUM_RACES: PodiumRace[] = [
  {
    id: 'brazil-2008',
    gp: 'Brazilian Grand Prix',
    year: 2008,
    note: 'Massa won at home and was champion for 38 seconds — until Hamilton stole it on the last corner of the season.',
    podium: [
      { driver: 'Felipe Massa', team: 'Ferrari' },
      { driver: 'Fernando Alonso', team: 'Renault' },
      { driver: 'Kimi Räikkönen', team: 'Ferrari' },
    ],
  },
  {
    id: 'abu-dhabi-2021',
    gp: 'Abu Dhabi Grand Prix',
    year: 2021,
    note: 'A last-lap safety-car restart handed Verstappen his first title in the most contested finish in years.',
    podium: [
      { driver: 'Max Verstappen', team: 'Red Bull' },
      { driver: 'Lewis Hamilton', team: 'Mercedes' },
      { driver: 'Carlos Sainz', team: 'Ferrari' },
    ],
  },
  {
    id: 'italy-2020',
    gp: 'Italian Grand Prix',
    year: 2020,
    note: 'Pierre Gasly\'s shock Monza win for AlphaTauri — one of the unlikeliest victories of the era.',
    podium: [
      { driver: 'Pierre Gasly', team: 'AlphaTauri' },
      { driver: 'Carlos Sainz', team: 'McLaren' },
      { driver: 'Lance Stroll', team: 'Racing Point' },
    ],
  },
  {
    id: 'turkey-2020',
    gp: 'Turkish Grand Prix',
    year: 2020,
    note: 'On a treacherously slick Istanbul track, Hamilton wrapped up his seventh world title.',
    podium: [
      { driver: 'Lewis Hamilton', team: 'Mercedes' },
      { driver: 'Sergio Pérez', team: 'Racing Point' },
      { driver: 'Sebastian Vettel', team: 'Ferrari' },
    ],
  },
  {
    id: 'brazil-2012',
    gp: 'Brazilian Grand Prix',
    year: 2012,
    note: 'Vettel spun on lap 1, recovered through the chaos, and clinched the title as Button took the win.',
    podium: [
      { driver: 'Jenson Button', team: 'McLaren' },
      { driver: 'Fernando Alonso', team: 'Ferrari' },
      { driver: 'Felipe Massa', team: 'Ferrari' },
    ],
  },
  {
    id: 'abu-dhabi-2010',
    gp: 'Abu Dhabi Grand Prix',
    year: 2010,
    note: 'Vettel won the race and the title from fourth on the grid, as Alonso was stuck behind Petrov in P7.',
    podium: [
      { driver: 'Sebastian Vettel', team: 'Red Bull' },
      { driver: 'Lewis Hamilton', team: 'McLaren' },
      { driver: 'Jenson Button', team: 'McLaren' },
    ],
  },
  {
    id: 'japan-2005',
    gp: 'Japanese Grand Prix',
    year: 2005,
    note: 'Räikkönen carved from 17th to win on the final lap at Suzuka — a legendary charge.',
    podium: [
      { driver: 'Kimi Räikkönen', team: 'McLaren' },
      { driver: 'Giancarlo Fisichella', team: 'Renault' },
      { driver: 'Fernando Alonso', team: 'Renault' },
    ],
  },
  {
    id: 'singapore-2008',
    gp: 'Singapore Grand Prix',
    year: 2008,
    note: 'F1\'s first night race — and the infamous "Crashgate" that gifted Alonso the win.',
    podium: [
      { driver: 'Fernando Alonso', team: 'Renault' },
      { driver: 'Nico Rosberg', team: 'Williams' },
      { driver: 'Lewis Hamilton', team: 'McLaren' },
    ],
  },
  {
    id: 'canada-2011',
    gp: 'Canadian Grand Prix',
    year: 2011,
    note: 'The longest race in F1 history. Button came back from last on the final lap to win.',
    podium: [
      { driver: 'Jenson Button', team: 'McLaren' },
      { driver: 'Sebastian Vettel', team: 'Red Bull' },
      { driver: 'Mark Webber', team: 'Red Bull' },
    ],
  },
  {
    id: 'germany-2019',
    gp: 'German Grand Prix',
    year: 2019,
    note: 'Rain turned Hockenheim into chaos. Verstappen won; Vettel climbed from P20 to P2.',
    podium: [
      { driver: 'Max Verstappen', team: 'Red Bull' },
      { driver: 'Sebastian Vettel', team: 'Ferrari' },
      { driver: 'Daniil Kvyat', team: 'Toro Rosso' },
    ],
  },
  {
    id: 'spain-2016',
    gp: 'Spanish Grand Prix',
    year: 2016,
    note: 'The Mercedes pair crashed on lap 1, and 18-year-old Verstappen won on his Red Bull debut.',
    podium: [
      { driver: 'Max Verstappen', team: 'Red Bull' },
      { driver: 'Kimi Räikkönen', team: 'Ferrari' },
      { driver: 'Sebastian Vettel', team: 'Ferrari' },
    ],
  },
  {
    id: 'britain-2008',
    gp: 'British Grand Prix',
    year: 2008,
    note: 'A masterclass in the wet — Hamilton won at home by over a minute.',
    podium: [
      { driver: 'Lewis Hamilton', team: 'McLaren' },
      { driver: 'Nick Heidfeld', team: 'BMW Sauber' },
      { driver: 'Rubens Barrichello', team: 'Honda' },
    ],
  },
  {
    id: 'italy-2021',
    gp: 'Italian Grand Prix',
    year: 2021,
    note: 'Verstappen and Hamilton collided; Ricciardo led a McLaren 1-2 at Monza.',
    podium: [
      { driver: 'Daniel Ricciardo', team: 'McLaren' },
      { driver: 'Lando Norris', team: 'McLaren' },
      { driver: 'Valtteri Bottas', team: 'Mercedes' },
    ],
  },
  {
    id: 'hungary-2006',
    gp: 'Hungarian Grand Prix',
    year: 2006,
    note: 'From 14th on the grid in the wet, Button took his first F1 win for Honda.',
    podium: [
      { driver: 'Jenson Button', team: 'Honda' },
      { driver: 'Pedro de la Rosa', team: 'McLaren' },
      { driver: 'Nick Heidfeld', team: 'BMW Sauber' },
    ],
  },
  {
    id: 'mexico-2021',
    gp: 'Mexico City Grand Prix',
    year: 2021,
    note: 'Verstappen led every lap; Pérez became the first Mexican on his home podium.',
    podium: [
      { driver: 'Max Verstappen', team: 'Red Bull' },
      { driver: 'Lewis Hamilton', team: 'Mercedes' },
      { driver: 'Sergio Pérez', team: 'Red Bull' },
    ],
  },
  {
    id: 'australia-2022',
    gp: 'Australian Grand Prix',
    year: 2022,
    note: 'Leclerc\'s grand slam — pole, win, fastest lap and every lap led for Ferrari.',
    podium: [
      { driver: 'Charles Leclerc', team: 'Ferrari' },
      { driver: 'Sergio Pérez', team: 'Red Bull' },
      { driver: 'George Russell', team: 'Mercedes' },
    ],
  },
  {
    id: 'saudi-arabia-2021',
    gp: 'Saudi Arabian Grand Prix',
    year: 2021,
    note: 'Three red flags and a wheel-to-wheel war between the title rivals at Jeddah.',
    podium: [
      { driver: 'Lewis Hamilton', team: 'Mercedes' },
      { driver: 'Max Verstappen', team: 'Red Bull' },
      { driver: 'Valtteri Bottas', team: 'Mercedes' },
    ],
  },
  {
    id: 'las-vegas-2023',
    gp: 'Las Vegas Grand Prix',
    year: 2023,
    note: 'A surprise thriller down the Strip, decided by a late Verstappen pass on Leclerc.',
    podium: [
      { driver: 'Max Verstappen', team: 'Red Bull' },
      { driver: 'Charles Leclerc', team: 'Ferrari' },
      { driver: 'Sergio Pérez', team: 'Red Bull' },
    ],
  },
]

export interface Rating {
  label: string
  color: string
  sub: string
}

// `off` = total positions off across the game (0 best). 0 = a flawless run.
export function ratingFor(off: number): Rating {
  if (off === 0) return { label: 'Pit-Perfect', color: '#d4a017', sub: 'Every rostrum, dead right. Encyclopaedic.' }
  if (off <= 2) return { label: 'Podium Sharp', color: '#c0c0c0', sub: 'Barely a place out — you know your history.' }
  if (off <= 5) return { label: 'On the Box', color: '#cd7f32', sub: 'Solid recall. A few results slipped past you.' }
  if (off <= 9) return { label: 'Midfield Memory', color: '#888888', sub: 'You got the gist — the order needs work.' }
  return { label: 'Back of the Grid', color: '#666666', sub: 'Time to rewatch some classic races.' }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Fold positions-off + a sub-1 time fraction into one ascending leaderboard score.
// positionsOff dominates; time only ever separates otherwise-equal runs.
export function composeScore(positionsOff: number, totalMs: number): number {
  const frac = Math.min(totalMs, TIME_CAP_MS) / (TIME_CAP_MS + 1)
  return Math.round((positionsOff + frac) * 1000) / 1000
}
