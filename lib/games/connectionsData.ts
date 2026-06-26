// ── F1 Connections puzzle data ──────────────────────────────────────────────────
// Each puzzle has 16 tiles in 4 groups of 4. `difficulty` drives the colour
// (0 = easiest/gold → 3 = hardest/purple). Every tile belongs to exactly one
// group within its puzzle; overlaps between categories are intentional red herrings.

export interface ConnGroup {
  category: string
  difficulty: 0 | 1 | 2 | 3
  members: [string, string, string, string]
}

export interface ConnPuzzle {
  groups: [ConnGroup, ConnGroup, ConnGroup, ConnGroup]
}

export const DIFFICULTY_COLORS = ['#d4a017', '#38b000', '#3b82f6', '#a855f7'] as const
export const DIFFICULTY_EMOJI = ['🟨', '🟩', '🟦', '🟪'] as const

export const PUZZLES: ConnPuzzle[] = [
  {
    groups: [
      { category: 'Drove for Ferrari', difficulty: 0, members: ['Leclerc', 'Sainz', 'Vettel', 'Räikkönen'] },
      { category: 'British World Champions', difficulty: 1, members: ['Hamilton', 'Button', 'Stewart', 'Mansell'] },
      { category: 'Mercedes works drivers', difficulty: 2, members: ['Rosberg', 'Bottas', 'Russell', 'Schumacher'] },
      { category: 'Won the Monaco GP', difficulty: 3, members: ['Ricciardo', 'Pérez', 'Webber', 'Trulli'] },
    ],
  },
  {
    groups: [
      { category: 'Pirelli tyre compounds', difficulty: 0, members: ['Soft', 'Medium', 'Hard', 'Intermediate'] },
      { category: 'Team principals', difficulty: 1, members: ['Wolff', 'Horner', 'Vasseur', 'Brown'] },
      { category: 'Engine manufacturers', difficulty: 2, members: ['Ferrari', 'Mercedes', 'Honda', 'Renault'] },
      { category: 'Street circuits', difficulty: 3, members: ['Monaco', 'Singapore', 'Baku', 'Jeddah'] },
    ],
  },
  {
    groups: [
      { category: 'Red Bull Racing drivers', difficulty: 0, members: ['Verstappen', 'Pérez', 'Ricciardo', 'Albon'] },
      { category: 'McLaren drivers', difficulty: 1, members: ['Norris', 'Piastri', 'Sainz', 'Alonso'] },
      { category: 'One-time World Champions', difficulty: 2, members: ['Button', 'Räikkönen', 'Rosberg', 'Villeneuve'] },
      { category: 'Grands Prix in the Americas', difficulty: 3, members: ['Miami', 'Austin', 'Mexico', 'Brazil'] },
    ],
  },
  {
    groups: [
      { category: 'Parts of an F1 car', difficulty: 0, members: ['Halo', 'Wing', 'Diffuser', 'Floor'] },
      { category: 'Flags', difficulty: 1, members: ['Yellow', 'Red', 'Blue', 'Chequered'] },
      { category: 'Race weekend sessions', difficulty: 2, members: ['Practice', 'Qualifying', 'Sprint', 'Race'] },
      { category: 'Father-and-son F1 names', difficulty: 3, members: ['Schumacher', 'Verstappen', 'Rosberg', 'Villeneuve'] },
    ],
  },
  {
    groups: [
      { category: 'UK-based teams', difficulty: 0, members: ['McLaren', 'Williams', 'Mercedes', 'Aston Martin'] },
      { category: 'Teams not based in the UK', difficulty: 1, members: ['Ferrari', 'Sauber', 'RB', 'Haas'] },
      { category: 'Asian Grands Prix', difficulty: 2, members: ['Suzuka', 'Shanghai', 'Singapore', 'Qatar'] },
      { category: "Hamilton's teammates", difficulty: 3, members: ['Bottas', 'Button', 'Alonso', 'Kovalainen'] },
    ],
  },
  {
    groups: [
      { category: 'On the podium', difficulty: 0, members: ['Champagne', 'Trophy', 'Anthem', 'Cap'] },
      { category: 'Defunct constructors', difficulty: 1, members: ['Lotus', 'Jordan', 'Brawn', 'Tyrrell'] },
      { category: 'Current teams', difficulty: 2, members: ['Red Bull', 'McLaren', 'Ferrari', 'Williams'] },
      { category: 'Reasons for a DNF', difficulty: 3, members: ['Puncture', 'Engine', 'Collision', 'Gearbox'] },
    ],
  },
  {
    groups: [
      { category: 'Qualifying terms', difficulty: 0, members: ['Q1', 'Q2', 'Q3', 'Pole'] },
      { category: 'Finnish drivers', difficulty: 1, members: ['Häkkinen', 'Räikkönen', 'Bottas', 'Kovalainen'] },
      { category: 'On the 2025 grid', difficulty: 2, members: ['Verstappen', 'Norris', 'Leclerc', 'Russell'] },
      { category: 'Legendary corners', difficulty: 3, members: ['Eau Rouge', 'Maggotts', '130R', 'Parabolica'] },
    ],
  },
  {
    groups: [
      { category: 'Pit-stop kit', difficulty: 0, members: ['Jack', 'Wheel gun', 'Tyres', 'Lollipop'] },
      { category: "Won a Constructors' title", difficulty: 1, members: ['Mercedes', 'Red Bull', 'Ferrari', 'Williams'] },
      { category: 'European Grands Prix', difficulty: 2, members: ['Monza', 'Spa', 'Silverstone', 'Zandvoort'] },
      { category: 'Champions with 2+ teams', difficulty: 3, members: ['Hamilton', 'Schumacher', 'Prost', 'Lauda'] },
    ],
  },
]

/** Days since the Unix epoch (UTC) — stable per calendar day for the daily puzzle. */
export function getDayIndex(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
}

export function getDailyPuzzleIndex(date = new Date()): number {
  return getDayIndex(date) % PUZZLES.length
}
