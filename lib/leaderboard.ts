'use client'

import { getSupabase, ensureAnonSession, supabaseEnabled } from './supabase'

export interface ScoreRow {
  id: string
  game_id: string
  player_id: string
  username: string
  score: number
  fav_team: string | null
  fav_driver: string | null
  country: string | null
  created_at: string
}

export interface PlayerProfile {
  username: string
  favTeam?: string | null
  favDriver?: string | null
  country?: string | null
}

const PROFILE_KEY = 'f1rs_player_profile'

export function loadProfile(): PlayerProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveProfile(p: PlayerProfile) {
  if (typeof window !== 'undefined') localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}

// Client-side username hygiene = instant feedback only. The server (submit_score
// RPC) is the authoritative gate — it can't be bypassed by calling the API direct.
// Mirror of the server's normalize_name + a subset of banned_words.
const BANNED = [
  'fuck', 'shit', 'cunt', 'bitch', 'bastard', 'asshole', 'dick', 'pussy', 'cock',
  'wanker', 'whore', 'slut', 'rape', 'rapist', 'nigger', 'nigga', 'faggot',
  'retard', 'spastic', 'coon', 'chink', 'kike', 'paki', 'tranny', 'molest',
  'pedo', 'pedophile', 'nazi', 'hitler', 'cum', 'jizz', 'twat',
]
function normalizeName(s: string): string {
  const leet: Record<string, string> = { '@': 'a', $: 's', '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '|': 'l', '!': 'i' }
  return s.toLowerCase().replace(/[@$013457|!]/g, (c) => leet[c] ?? c).replace(/[^a-z]/g, '')
}
export function cleanUsername(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 24)
}
export function usernameError(name: string): string | null {
  const n = cleanUsername(name)
  if (n.length < 2) return 'Enter at least 2 characters'
  const norm = normalizeName(n)
  if (norm && BANNED.some((w) => norm.includes(w))) return 'Please choose a different name'
  return null
}

export { supabaseEnabled }

/** Submit (or update) the player's best score for a game. Returns the saved row. */
export async function submitScore(
  gameId: string,
  score: number,
  profile: PlayerProfile,
  meta?: Record<string, unknown>,
): Promise<ScoreRow | null> {
  const sb = getSupabase()
  if (!sb) return null
  await ensureAnonSession()
  const { data, error } = await sb.rpc('submit_score', {
    p_game_id: gameId,
    p_score: score,
    p_username: cleanUsername(profile.username),
    p_team: profile.favTeam ?? null,
    p_driver: profile.favDriver ?? null,
    p_country: profile.country ?? null,
    p_meta: meta ?? null,
  })
  if (error) throw error
  return data as ScoreRow
}

/** Top N scores for a game (sorted by the game's direction). */
export async function getLeaderboard(
  gameId: string,
  opts: { limit?: number; ascending?: boolean } = {},
): Promise<ScoreRow[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from('scores')
    .select('id, game_id, player_id, username, score, fav_team, fav_driver, country, created_at')
    .eq('game_id', gameId)
    .order('score', { ascending: opts.ascending ?? false })
    .order('created_at', { ascending: true })
    .limit(opts.limit ?? 20)
  if (error) throw error
  return (data ?? []) as ScoreRow[]
}

/** This player's row + 1-based rank for a game, or null if they haven't submitted. */
export async function getMyEntry(
  gameId: string,
  opts: { ascending?: boolean } = {},
): Promise<{ row: ScoreRow; rank: number } | null> {
  const sb = getSupabase()
  if (!sb) return null
  const uid = await ensureAnonSession()
  if (!uid) return null
  const { data: mine } = await sb
    .from('scores').select('*').eq('game_id', gameId).eq('player_id', uid).maybeSingle()
  if (!mine) return null
  const row = mine as ScoreRow
  // rank = (# strictly better) + 1
  const cmp = opts.ascending ? 'lt' : 'gt'
  const { count } = await sb
    .from('scores')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)[cmp]('score', row.score)
  return { row, rank: (count ?? 0) + 1 }
}
