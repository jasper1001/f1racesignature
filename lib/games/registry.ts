import { RADIO_QUOTES } from '@/lib/games/teamRadioData'

// ── Central registry for the mini-games ─────────────────────────────────────────
// Single source of truth for the games hub grid, the "Next Game" suggestion card,
// and session tracking. Order here is the canonical popularity order (most played
// first) and drives both the hub layout and the next-game loop.

export interface GameMeta {
  id: string
  href: string
  /** Short category label shown above the title on the hub card */
  tag: string
  title: string
  /** Full hub-card description */
  description: string
  /** One-line teaser used in the "Next Game" suggestion card */
  blurb: string
  duration: string
  accent: string
  icon: string
  /** Optional engagement badge shown on the hub card */
  badge?: string
}

export const GAMES: GameMeta[] = [
  {
    id: 'championship-decider',
    href: '/games/championship-decider',
    tag: 'F1 Strategy',
    title: 'Championship Decider',
    description:
      'Relive real F1 strategy moments and decide what you would do from the pit wall. Abu Dhabi 2021. Monaco 2016. Turkey 2020.',
    blurb: 'Real F1 strategy calls from the pit wall — would you have got them right?',
    duration: '~10 minutes',
    accent: '#3b82f6',
    icon: '🏆',
    badge: 'Most Played',
  },
  {
    id: 'pit-stop-timer',
    href: '/games/pit-stop-timer',
    tag: 'Pit Wall',
    title: 'Pit Stop Timer',
    description:
      'A target stop time is shown. Start the timer and release the car as close to it as possible. Too early is an unsafe release. Too late loses positions.',
    blurb: 'Release the car at the perfect moment. How sharp are your reactions?',
    duration: '~1 minute',
    accent: '#06b6d4',
    icon: '⏱️',
    badge: 'Fan Favourite',
  },
  {
    id: 'track-outline',
    href: '/games/track-outline',
    tag: 'Circuit Knowledge',
    title: 'Track Outline Quiz',
    description:
      'Recognise the circuit from its outline alone. Easy at Monaco. Brutal at Bahrain.',
    blurb: 'Name the circuit from its silhouette alone. Easy at Monaco, brutal at Bahrain.',
    duration: '~2 minutes',
    accent: '#a855f7',
    icon: '🗺️',
    badge: 'Quick Play',
  },
  {
    id: 'draw-the-circuit',
    href: '/games/draw-the-circuit',
    tag: 'Circuit Art',
    title: 'Draw the Circuit',
    description:
      "You're given a circuit name — draw its outline from memory in one stroke, then see how close you got to the real layout. Easy at Monaco, brutal at Suzuka.",
    blurb: 'Sketch an F1 track from memory and get scored on accuracy.',
    duration: '~1 minute',
    accent: '#ec4899',
    icon: '✏️',
    badge: 'New',
  },
  {
    id: 'track-builder',
    href: '/games/track-builder',
    tag: 'Circuit Puzzle',
    title: 'Track Builder',
    description:
      'A real F1 circuit, scrambled into tiles. Swap them to rebuild the track as fast as you can — then race the global clock.',
    blurb: 'Rebuild a scrambled F1 circuit against the clock — fastest build wins.',
    duration: '~1 minute',
    accent: '#84cc16',
    icon: '🏗️',
    badge: 'New',
  },
  {
    id: 'name-that-lap',
    href: '/games/name-that-lap',
    tag: 'Telemetry Quiz',
    title: 'Name That Lap',
    description:
      'A real F1 lap is drawn out as a racing line — no name, no labels. Read the shape and name the circuit from four options.',
    blurb: 'A racing line with no labels — can you name the circuit from its shape?',
    duration: '~2 minutes',
    accent: '#8b5cf6',
    icon: '📈',
    badge: 'New',
  },
  {
    id: 'guess-the-lap-time',
    href: '/games/guess-the-lap-time',
    tag: 'Time Trial',
    title: 'Guess the Lap Time',
    description:
      "A real F1 lap is shown — circuit, driver and year. Slide to guess its lap time; the closer you are, the lower your score.",
    blurb: 'How fast was that F1 lap? Slide to guess — closest wins.',
    duration: '~2 minutes',
    accent: '#e11d48',
    icon: '⏲️',
    badge: 'New',
  },
  {
    id: 'podium-scramble',
    href: '/games/podium-scramble',
    tag: 'Race Results',
    title: 'Podium Scramble',
    description:
      'A famous F1 race with its podium scrambled. Reorder the three drivers into the correct finishing order — P1, P2, P3. Six races, fewest positions off wins.',
    blurb: 'A scrambled F1 podium — can you put P1, P2 and P3 back in order?',
    duration: '~2 minutes',
    accent: '#d4a017',
    icon: '🥇',
    badge: 'New',
  },
  {
    id: 'connections',
    href: '/games/connections',
    tag: 'Daily Puzzle',
    title: 'F1 Connections',
    description:
      "A daily F1 twist on Connections. Sort sixteen tiles into four hidden groups — drivers, teams, circuits and more. Four wrong guesses and you're out.",
    blurb: 'Sort 16 F1 tiles into four hidden groups — mind the overlaps.',
    duration: '~3 minutes',
    accent: '#14b8a6',
    icon: '🧩',
    badge: 'New',
  },
  {
    id: 'tier-list',
    href: '/games/tier-list',
    tag: 'Hot Takes',
    title: "Rank 'Em",
    description:
      'Drag F1 drivers, teams and circuits into S–D tiers and build your own ranking. No right answers — just settle the debate and share your hot takes.',
    blurb: 'Drag drivers and teams into S–D tiers and share your ranking.',
    duration: '~2 minutes',
    accent: '#f43f5e',
    icon: '🏅',
    badge: 'New',
  },
  {
    id: 'career-path',
    href: '/games/career-path',
    tag: 'Guess the Driver',
    title: 'Career Path',
    description:
      'Toro Rosso, Red Bull, Aston Martin… A driver\'s teams are revealed one at a time. Name the driver on the fewest teams you can for the highest score.',
    blurb: 'Name the F1 driver from the teams they raced for.',
    duration: '~2 minutes',
    accent: '#0ea5e9',
    icon: '🔀',
    badge: 'New',
  },
  {
    id: 'higher-lower',
    href: '/games/higher-lower',
    tag: 'Stat Battle',
    title: 'Higher or Lower',
    description:
      'Does Driver B have more career wins than Driver A? Compare stats across wins, poles, podiums, fastest laps, championships and race starts. Build your streak.',
    blurb: 'More wins or fewer? Compare F1 driver stats and build your streak.',
    duration: 'Endless',
    accent: '#f97316',
    icon: '⚡',
  },
  {
    id: 'predict-driver',
    href: '/games/predict-driver',
    tag: 'F1 Wordle',
    title: 'Predict the Driver',
    description:
      'Wordle for F1. Identify the mystery driver in 6 guesses using nationality, wins, poles, debut year, and team hints. Daily + Endless modes.',
    blurb: 'Wordle for F1 — crack the mystery driver in six guesses.',
    duration: '~2 minutes',
    accent: '#6366f1',
    icon: '🎯',
  },
  {
    id: 'guess-the-driver',
    href: '/games/guess-the-driver',
    tag: 'F1 Knowledge',
    title: 'Guess the Driver',
    description:
      'Clues about an F1 driver are revealed one at a time. Identify them early for maximum points. 53 drivers across every era.',
    blurb: 'Clues drop one by one — name the driver early for maximum points.',
    duration: '~1 minute',
    accent: '#f59e0b',
    icon: '🏎️',
  },
  {
    id: 'team-radio',
    href: '/games/team-radio',
    tag: 'F1 Knowledge',
    title: 'Team Radio Guess',
    description:
      `Famous quotes from the pit wall. A transmission plays — you pick the driver. ${RADIO_QUOTES.length} legendary radio moments across every era.`,
    blurb: 'A famous radio transmission plays — can you pick the driver?',
    duration: '~3 minutes',
    accent: '#10b981',
    icon: '📻',
  },
  {
    id: 'lights-out',
    href: '/games/lights-out',
    tag: 'Reaction Test',
    title: 'Lights Out',
    description:
      "Watch all five starting lights illuminate one by one. The moment they go dark — tap as fast as you can. Don't jump the start.",
    blurb: 'Five lights, then go. Tap the instant they go dark — no jump starts.',
    duration: '~30 seconds',
    accent: '#ef4444',
    icon: '🚦',
  },
]

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find(g => g.id === id)
}

/** The next game to suggest after finishing `currentId`, looping through the list. */
export function getNextGame(currentId: string): GameMeta {
  const idx = GAMES.findIndex(g => g.id === currentId)
  if (idx === -1) return GAMES[0]
  return GAMES[(idx + 1) % GAMES.length]
}
