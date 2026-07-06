-- Migration: Race Predictions league. Safe to re-run.
-- Run this in the Supabase SQL editor (after schema.sql + 001…010).
--
-- Design:
--   * One prediction row per (season, round, player). Players pick pole + the
--     podium (P1/P2/P3) before qualifying starts; they can revise until then.
--   * Lock enforcement is SERVER-SIDE: prediction_rounds holds each round's
--     lock time (start of the weekend's first qualifying session — Sprint
--     Qualifying on sprint weekends). submit_prediction() rejects anything
--     after locks_at, so late picks are impossible even via direct API calls.
--   * Points are NEVER stored. The app derives them client-side by comparing
--     locked picks against real race results from the Jolpica F1 API, so
--     there is no scoring write path to spoof.
--   * Usernames reuse the curated racer-name whitelist from migration 005.

-- ── Rounds & lock times ──────────────────────────────────────────────────────
-- Seeded from the official calendar (Jolpica /2026.json). locks_at = Sprint
-- Qualifying start on sprint weekends, else Qualifying start. When next
-- season's calendar is out, insert its rows here (upsert keeps this re-runnable).
create table if not exists public.prediction_rounds (
  season     text        not null,
  round      int         not null,
  race_name  text        not null,
  locks_at   timestamptz not null,
  race_at    timestamptz not null,
  has_sprint boolean     not null default false,
  primary key (season, round)
);

insert into public.prediction_rounds (season, round, race_name, locks_at, race_at, has_sprint) values
  ('2026', 1, 'Australian Grand Prix', '2026-03-07T05:00:00Z', '2026-03-08T04:00:00Z', false),
  ('2026', 2, 'Chinese Grand Prix', '2026-03-13T07:30:00Z', '2026-03-15T07:00:00Z', true),
  ('2026', 3, 'Japanese Grand Prix', '2026-03-28T06:00:00Z', '2026-03-29T05:00:00Z', false),
  ('2026', 4, 'Miami Grand Prix', '2026-05-01T20:30:00Z', '2026-05-03T20:00:00Z', true),
  ('2026', 5, 'Canadian Grand Prix', '2026-05-22T20:30:00Z', '2026-05-24T20:00:00Z', true),
  ('2026', 6, 'Monaco Grand Prix', '2026-06-06T14:00:00Z', '2026-06-07T13:00:00Z', false),
  ('2026', 7, 'Barcelona Grand Prix', '2026-06-13T14:00:00Z', '2026-06-14T13:00:00Z', false),
  ('2026', 8, 'Austrian Grand Prix', '2026-06-27T14:00:00Z', '2026-06-28T13:00:00Z', false),
  ('2026', 9, 'British Grand Prix', '2026-07-03T15:30:00Z', '2026-07-05T14:00:00Z', true),
  ('2026', 10, 'Belgian Grand Prix', '2026-07-18T14:00:00Z', '2026-07-19T13:00:00Z', false),
  ('2026', 11, 'Hungarian Grand Prix', '2026-07-25T14:00:00Z', '2026-07-26T13:00:00Z', false),
  ('2026', 12, 'Dutch Grand Prix', '2026-08-21T14:30:00Z', '2026-08-23T13:00:00Z', true),
  ('2026', 13, 'Italian Grand Prix', '2026-09-05T14:00:00Z', '2026-09-06T13:00:00Z', false),
  ('2026', 14, 'Spanish Grand Prix', '2026-09-12T14:00:00Z', '2026-09-13T13:00:00Z', false),
  ('2026', 15, 'Azerbaijan Grand Prix', '2026-09-25T12:00:00Z', '2026-09-26T11:00:00Z', false),
  ('2026', 16, 'Singapore Grand Prix', '2026-10-09T12:30:00Z', '2026-10-11T12:00:00Z', true),
  ('2026', 17, 'United States Grand Prix', '2026-10-24T21:00:00Z', '2026-10-25T20:00:00Z', false),
  ('2026', 18, 'Mexico City Grand Prix', '2026-10-31T21:00:00Z', '2026-11-01T20:00:00Z', false),
  ('2026', 19, 'Brazilian Grand Prix', '2026-11-07T18:00:00Z', '2026-11-08T17:00:00Z', false),
  ('2026', 20, 'Las Vegas Grand Prix', '2026-11-21T04:00:00Z', '2026-11-22T04:00:00Z', false),
  ('2026', 21, 'Qatar Grand Prix', '2026-11-28T18:00:00Z', '2026-11-29T16:00:00Z', false),
  ('2026', 22, 'Abu Dhabi Grand Prix', '2026-12-05T14:00:00Z', '2026-12-06T13:00:00Z', false)
on conflict (season, round) do update
  set race_name = excluded.race_name,
      locks_at   = excluded.locks_at,
      race_at    = excluded.race_at,
      has_sprint = excluded.has_sprint;

-- ── Predictions ──────────────────────────────────────────────────────────────
create table if not exists public.predictions (
  id         uuid primary key default gen_random_uuid(),
  season     text not null,
  round      int  not null,
  player_id  uuid not null,                    -- = auth.uid()
  username   text not null,
  pole       text not null,                    -- Ergast driverId, e.g. 'verstappen'
  p1         text not null,
  p2         text not null,
  p3         text not null,
  country    text,                             -- ISO 3166 alpha-2
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season, round, player_id),
  foreign key (season, round) references public.prediction_rounds (season, round)
);

create index if not exists predictions_season_round  on public.predictions (season, round);
create index if not exists predictions_season_player on public.predictions (season, player_id);

-- RLS: everyone can read (the league table is public), nobody writes directly —
-- all writes go through submit_prediction(), which enforces the lock.
alter table public.prediction_rounds enable row level security;
alter table public.predictions       enable row level security;

drop policy if exists "prediction rounds public read" on public.prediction_rounds;
create policy "prediction rounds public read" on public.prediction_rounds for select using (true);

drop policy if exists "predictions public read" on public.predictions;
create policy "predictions public read" on public.predictions for select using (true);

-- ── Submit / update picks (until the round locks) ────────────────────────────
create or replace function public.submit_prediction(
  p_season   text,
  p_round    int,
  p_pole     text,
  p_p1       text,
  p_p2       text,
  p_p3       text,
  p_username text,
  p_country  text default null
) returns public.predictions
language plpgsql
security definer
set search_path = ''
as $$
declare
  rnd      public.prediction_rounds;
  uname    text;
  norm     text;
  ctry     text;
  result   public.predictions;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into rnd from public.prediction_rounds
    where season = p_season and round = p_round;
  if rnd.season is null then
    raise exception 'unknown round % %', p_season, p_round;
  end if;

  -- THE core rule: no picks once qualifying has started.
  if now() >= rnd.locks_at then
    raise exception 'predictions are locked for this round';
  end if;

  -- Picks must look like Ergast driverIds and the podium must be 3 different drivers.
  if p_pole !~ '^[a-z0-9_]{2,40}$' or p_p1 !~ '^[a-z0-9_]{2,40}$'
     or p_p2 !~ '^[a-z0-9_]{2,40}$' or p_p3 !~ '^[a-z0-9_]{2,40}$' then
    raise exception 'invalid driver pick';
  end if;
  if p_p1 = p_p2 or p_p1 = p_p3 or p_p2 = p_p3 then
    raise exception 'podium picks must be three different drivers';
  end if;

  uname := left(nullif(btrim(p_username), ''), 24);
  if uname is null then
    raise exception 'username required';
  end if;

  -- racer-name gate (same as submit_score): curated <Adjective><Noun>_<NN> only.
  if uname !~ '^[A-Za-z-]+_[0-9]{1,2}$'
     or not exists (
       select 1 from public.racer_adjectives a
       join public.racer_nouns n
         on regexp_replace(uname, '_[0-9]{1,2}$', '') = a.word || n.word
     ) then
    raise exception 'invalid username';
  end if;

  -- profanity gate kept as defence-in-depth (redundant for curated names).
  norm := public.normalize_name(uname);
  if norm <> '' and exists (
    select 1 from public.banned_words b where norm like '%' || b.word || '%'
  ) then
    raise exception 'inappropriate username';
  end if;

  ctry := case when p_country ~ '^[A-Za-z]{2}$' then upper(p_country) else null end;

  insert into public.predictions (season, round, player_id, username, pole, p1, p2, p3, country)
  values (p_season, p_round, auth.uid(), uname, p_pole, p_p1, p_p2, p_p3, ctry)
  on conflict (season, round, player_id) do update
    set pole = excluded.pole, p1 = excluded.p1, p2 = excluded.p2, p3 = excluded.p3,
        username = excluded.username, country = excluded.country, updated_at = now()
  returning * into result;

  return result;
end;
$$;

grant execute on function public.submit_prediction to anon, authenticated;
