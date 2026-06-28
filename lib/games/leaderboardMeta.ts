// Per-game leaderboard display config (sort direction + score suffix + accent),
// shared by the in-game submit card, the per-game page board, and the hub.
// Mirrors the sort_dir/caps in supabase game_config. "Rank 'Em" (tier-list) is
// intentionally absent — it has no objective score.

export interface LeaderboardMeta {
  ascending?: boolean   // true = lower score wins (times)
  suffix?: string       // e.g. '%' or 'ms'
  accent: string
}

export const LEADERBOARD_META: Record<string, LeaderboardMeta> = {
  'draw-the-circuit':     { accent: '#ec4899', suffix: '%' },
  'championship-decider': { accent: '#3b82f6' },
  'pit-stop-timer':       { accent: '#06b6d4', ascending: true, suffix: 'ms' },
  'track-outline':        { accent: '#a855f7' },
  'name-that-lap':        { accent: '#8b5cf6' },
  'track-builder':        { accent: '#84cc16', ascending: true, suffix: 'ms' },
  // Per-difficulty boards (browsed via the toggle on the game page; the hub shows
  // the Pro board under the single 'track-builder' tab above).
  'track-builder-rookie': { accent: '#84cc16', ascending: true, suffix: 'ms' },
  'track-builder-elite':  { accent: '#84cc16', ascending: true, suffix: 'ms' },
  'connections':          { accent: '#14b8a6' },
  'career-path':          { accent: '#0ea5e9' },
  'higher-lower':         { accent: '#f97316' },
  'predict-driver':       { accent: '#6366f1' },
  'guess-the-driver':     { accent: '#f59e0b' },
  'team-radio':           { accent: '#10b981' },
  'lights-out':           { accent: '#ef4444', ascending: true, suffix: 'ms' },
}

// Games that have a leaderboard, in display order (for the hub picker).
export const LEADERBOARD_GAME_IDS = [
  'draw-the-circuit', 'track-builder', 'name-that-lap', 'lights-out', 'pit-stop-timer',
  'track-outline', 'higher-lower', 'guess-the-driver', 'career-path', 'predict-driver',
  'team-radio', 'connections', 'championship-decider',
] as const
