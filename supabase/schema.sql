-- ===========================================================================
-- F1RaceSignature — game leaderboards (Supabase / Postgres)
-- Run this in the Supabase SQL editor. Requires "Anonymous sign-ins" enabled
-- under Authentication → Providers.
--
-- Design:
--   * Anonymous auth gives every device a stable auth.uid() (no login UI).
--   * One BEST row per (game, player). Clients never INSERT/UPDATE directly —
--     all writes go through submit_score(), a SECURITY DEFINER function that
--     enforces per-game sanity caps and keeps only each player's best.
--   * game_config drives caps + sort direction, so adding a game = one row.
-- ===========================================================================

-- Per-game rules: score bounds (anti-cheat) + which direction wins.
create table if not exists public.game_config (
  game_id   text primary key,
  sort_dir  text not null default 'desc' check (sort_dir in ('asc', 'desc')),
  min_score numeric not null default 0,
  max_score numeric not null,
  label     text                       -- e.g. 'Accuracy %', shown in the UI
);

-- Game leaderboard config. (Roll out a new game by adding a row here.)
insert into public.game_config (game_id, sort_dir, min_score, max_score, label) values
  ('draw-the-circuit',     'desc', 0,   100,    'Accuracy %'),
  ('championship-decider', 'desc', 0,   6000,   'Score'),
  ('pit-stop-timer',       'asc',  0,   10000,  'Closest (ms)'),
  ('track-outline',        'desc', 0,   10,     'Correct / 10'),
  ('name-that-lap',        'desc', 0,   10,     'Correct / 10'),
  ('guess-the-lap-time',   'asc',  0,   400000, 'Total off (ms)'),
  ('track-builder',        'asc',  0,   600000, 'Build time (ms)'),
  ('track-builder-rookie', 'asc',  0,   600000, 'Build time (ms)'),
  ('track-builder-elite',  'asc',  0,   900000, 'Build time (ms)'),
  ('connections',          'desc', 0,   3650,   'Daily streak'),
  ('career-path',          'desc', 0,   100,    'Score'),
  ('higher-lower',         'desc', 0,   100000, 'Streak'),
  ('predict-driver',       'desc', 0,   100000, 'Streak'),
  ('guess-the-driver',     'desc', 0,   100,    'Score'),
  ('team-radio',           'desc', 0,   1000,   'Score'),
  ('lights-out',           'asc',  80,  10000,  'Reaction (ms)')
on conflict (game_id) do nothing;

create table if not exists public.scores (
  id         uuid primary key default gen_random_uuid(),
  game_id    text not null references public.game_config(game_id),
  player_id  uuid not null,                       -- = auth.uid()
  username   text not null,
  score      numeric not null,
  fav_team   text,
  fav_driver text,
  country    text,                                -- ISO 3166 alpha-2, e.g. 'GB'
  meta       jsonb,
  hidden     boolean not null default false,       -- moderation: removes from board
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, player_id)                     -- one best row per player/game
);
-- Migrations for projects created before these columns existed (safe to re-run).
alter table public.scores add column if not exists country text;
alter table public.scores add column if not exists hidden boolean not null default false;

-- Banned words for username moderation (normalised: lowercase letters only).
create table if not exists public.banned_words (word text primary key);
insert into public.banned_words (word) values
  ('fuck'), ('shit'), ('cunt'), ('bitch'), ('bastard'), ('asshole'), ('dick'),
  ('pussy'), ('cock'), ('wanker'), ('whore'), ('slut'), ('rape'), ('rapist'),
  ('nigger'), ('nigga'), ('faggot'), ('retard'), ('spastic'), ('coon'),
  ('chink'), ('kike'), ('paki'), ('tranny'), ('molest'), ('pedophile'),
  ('pedo'), ('nazi'), ('hitler'), ('cum'), ('jizz'), ('twat')
on conflict (word) do nothing;
alter table public.banned_words enable row level security;  -- no policies = private

create index if not exists scores_game_score_desc on public.scores (game_id, score desc);
create index if not exists scores_game_score_asc  on public.scores (game_id, score asc);

-- RLS: public can READ; nobody can write directly (only the RPC, via definer).
alter table public.scores       enable row level security;
alter table public.game_config  enable row level security;

drop policy if exists "scores public read" on public.scores;
create policy "scores public read" on public.scores for select using (hidden = false);

drop policy if exists "config public read" on public.game_config;
create policy "config public read" on public.game_config for select using (true);

-- Normalise a name for matching: lowercase, undo leetspeak, drop non-letters,
-- so "x_F.u.c.k_x" / "sh1t" both reduce to the bare word.
create or replace function public.normalize_name(p text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(translate(lower(p), '@$013457|!', 'asoieastli'), '[^a-z]', '', 'g')
$$;

-- Submit (or update) the caller's score for a game. Validates caps, keeps best.
-- SECURITY DEFINER + pinned search_path; all refs are schema-qualified.
drop function if exists public.submit_score(text, numeric, text, text, text, jsonb);
drop function if exists public.submit_score(text, numeric, text, text, text, text, jsonb);
create or replace function public.submit_score(
  p_game_id text,
  p_score   numeric,
  p_username text,
  p_team    text default null,
  p_driver  text default null,
  p_country text default null,
  p_meta    jsonb default null
) returns public.scores
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg      public.game_config;
  uname    text;
  norm     text;
  ctry     text;
  existing public.scores;
  result   public.scores;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into cfg from public.game_config where game_id = p_game_id;
  if cfg.game_id is null then
    raise exception 'unknown game %', p_game_id;
  end if;

  -- anti-cheat: score must be a real number within the per-game caps (rejects NaN).
  if p_score is null or p_score = 'NaN'::numeric
     or p_score < cfg.min_score or p_score > cfg.max_score then
    raise exception 'score out of range';
  end if;

  uname := nullif(btrim(p_username), '');
  if uname is null then
    raise exception 'username required';
  end if;
  uname := left(uname, 24);

  -- profanity gate (server-side, can't be bypassed)
  norm := public.normalize_name(uname);
  if norm <> '' and exists (
    select 1 from public.banned_words b where norm like '%' || b.word || '%'
  ) then
    raise exception 'inappropriate username';
  end if;

  -- country: keep only a clean 2-letter code (uppercased), else drop.
  ctry := case when p_country ~ '^[A-Za-z]{2}$' then upper(p_country) else null end;
  -- free-text fields: trim + cap length (defensive; the UI uses fixed lists).
  p_team   := left(nullif(btrim(p_team), ''), 40);
  p_driver := left(nullif(btrim(p_driver), ''), 40);
  -- meta is opaque app data; reject oversized payloads from direct callers.
  if p_meta is not null and length(p_meta::text) > 1000 then
    raise exception 'meta too large';
  end if;

  select * into existing from public.scores
    where game_id = p_game_id and player_id = auth.uid();

  if existing.id is null then
    insert into public.scores (game_id, player_id, username, score, fav_team, fav_driver, country, meta)
    values (p_game_id, auth.uid(), uname, p_score, p_team, p_driver, ctry, p_meta)
    returning * into result;
  elsif (cfg.sort_dir = 'desc' and p_score > existing.score)
     or (cfg.sort_dir = 'asc'  and p_score < existing.score) then
    update public.scores set
      score = p_score, username = uname, fav_team = p_team,
      fav_driver = p_driver, country = ctry, meta = p_meta, updated_at = now()
    where id = existing.id returning * into result;
  else
    -- not a personal best: keep the score, just refresh the profile fields
    update public.scores set
      username = uname, fav_team = p_team, fav_driver = p_driver, country = ctry, updated_at = now()
    where id = existing.id returning * into result;
  end if;

  return result;
end;
$$;

grant execute on function public.submit_score to anon, authenticated;
