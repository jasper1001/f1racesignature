-- Migration: usernames must be a curated generated racer name. Safe to re-run.
-- The UI now only ever submits names built from two word lists (see
-- lib/racerName.ts), e.g. "TurboApex_47". This closes the last hole: a direct
-- API caller can no longer pass arbitrary free text — the name must decompose
-- into a known <Adjective><Noun>_<NN> combo. Word lists are mirrored here and
-- in lib/racerName.ts; KEEP THEM IN SYNC when adding/removing words.

-- 1. Word lists (RLS on, no policies = not client-readable). Must match lib/racerName.ts.
create table if not exists public.racer_adjectives (word text primary key);
create table if not exists public.racer_nouns (word text primary key);
alter table public.racer_adjectives enable row level security;
alter table public.racer_nouns enable row level security;

insert into public.racer_adjectives (word) values
  ('Turbo'),('Nitro'),('Slick'),('Rapid'),('Blazing'),('Flying'),('Bold'),
  ('Swift'),('Fierce'),('Mighty'),('Lightning'),('Roaring'),('Charging'),
  ('Boosted'),('Hybrid'),('Sideways'),('Greasy'),('Gritty'),('Howling'),
  ('Screaming'),('Reckless'),('Fearless'),('Smooth'),('Sharp'),('Wild'),
  ('Furious'),('Electric'),('Sonic'),('Flat-Out'),('Late')
on conflict (word) do nothing;

insert into public.racer_nouns (word) values
  ('Apex'),('Piston'),('Chicane'),('Slipstream'),('Throttle'),('Hairpin'),
  ('Kerb'),('Diffuser'),('Gearbox'),('Paddock'),('Podium'),('Rocket'),
  ('Comet'),('Bullet'),('Wrench'),('Marshal'),('Rookie'),('Ace'),('Charger'),
  ('Drifter'),('Burner'),('Screamer'),('Backmarker'),('Pitlane'),('Redline'),
  ('Downforce'),('Tyre'),('Halo'),('Overcut'),('Undercut')
on conflict (word) do nothing;

-- 2. Rebuild submit_score with the racer-name whitelist gate (keeps every existing check).
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

  -- score must be a real number within the per-game caps (rejects NaN too).
  if p_score is null or p_score = 'NaN'::numeric
     or p_score < cfg.min_score or p_score > cfg.max_score then
    raise exception 'score out of range';
  end if;

  uname := nullif(btrim(p_username), '');
  if uname is null then
    raise exception 'username required';
  end if;
  uname := left(uname, 24);

  -- racer-name gate: must be a curated <Adjective><Noun>_<NN> combo, so a direct
  -- API caller can't inject free text (the UI can only ever produce these).
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

  -- country: keep only a clean 2-letter code, uppercased; otherwise drop it.
  ctry := case when p_country ~ '^[A-Za-z]{2}$' then upper(p_country) else null end;

  -- free-text fields: trim + cap length (defensive, even though the UI uses lists).
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
    update public.scores set
      username = uname, fav_team = p_team, fav_driver = p_driver, country = ctry, updated_at = now()
    where id = existing.id returning * into result;
  end if;

  return result;
end;
$$;

grant execute on function public.submit_score to anon, authenticated;
