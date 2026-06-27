'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Null-safe singleton. Returns null when the project isn't configured yet, so the
// rest of the app (and the games) keep working without a Supabase backend.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null
if (url && anonKey) {
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
}

export const supabaseEnabled = Boolean(client)

export function getSupabase(): SupabaseClient | null {
  return client
}

// Ensure an anonymous session exists (silent — no login UI). Each device gets a
// stable auth.uid() so we can keep one best score per player and show their rank.
let anonPromise: Promise<string | null> | null = null
export function ensureAnonSession(): Promise<string | null> {
  if (!client) return Promise.resolve(null)
  if (anonPromise) return anonPromise
  anonPromise = (async () => {
    const { data } = await client!.auth.getSession()
    if (data.session?.user) return data.session.user.id
    const { data: signed, error } = await client!.auth.signInAnonymously()
    if (error) { anonPromise = null; return null }
    return signed.user?.id ?? null
  })()
  return anonPromise
}
