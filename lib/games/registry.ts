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
