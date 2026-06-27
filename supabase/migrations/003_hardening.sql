-- Migration: security hardening for the leaderboard write path. Safe to re-run.
--   1. Pin search_path to '' on the SECURITY DEFINER functions (defence against
--      search_path hijacking — all refs are already fully schema-qualified).
--   2. Validate `country` to an ISO-ish 2-letter code (else drop it).
--   3. Cap `meta` size (a direct API caller can't stuff huge payloads).
--   4. Cap username length harder + keep the profanity gate.

create or replace function public.normalize_name(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(translate(lower(p), '@$013457|!', 'asoieastli'), '[^a-z]', '', 'g')
$$;

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
