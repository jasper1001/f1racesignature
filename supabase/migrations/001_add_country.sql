-- Migration: add optional `country` (ISO 3166 alpha-2) to leaderboard scores.
-- Safe to re-run. Run in the Supabase SQL editor if you already created the
-- original schema (supabase/schema.sql) before `country` existed.

-- 1. Column
alter table public.scores add column if not exists country text;

-- 2. Replace submit_score with the country-aware version. Drop the old signature
--    first so there's no ambiguous overload.
drop function if exists public.submit_score(text, numeric, text, text, text, jsonb);

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
set search_path = public
as $$
declare
  cfg      public.game_config;
  uname    text;
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

  if p_score < cfg.min_score or p_score > cfg.max_score then
    raise exception 'score % out of range [%, %]', p_score, cfg.min_score, cfg.max_score;
  end if;

  uname := nullif(btrim(p_username), '');
  if uname is null then
    raise exception 'username required';
  end if;
  uname := left(uname, 24);

  select * into existing from public.scores
    where game_id = p_game_id and player_id = auth.uid();

  if existing.id is null then
    insert into public.scores (game_id, player_id, username, score, fav_team, fav_driver, country, meta)
    values (p_game_id, auth.uid(), uname, p_score, p_team, p_driver, p_country, p_meta)
    returning * into result;
  elsif (cfg.sort_dir = 'desc' and p_score > existing.score)
     or (cfg.sort_dir = 'asc'  and p_score < existing.score) then
    update public.scores set
      score = p_score, username = uname, fav_team = p_team,
      fav_driver = p_driver, country = p_country, meta = p_meta, updated_at = now()
    where id = existing.id returning * into result;
  else
    update public.scores set
      username = uname, fav_team = p_team, fav_driver = p_driver, country = p_country, updated_at = now()
    where id = existing.id returning * into result;
  end if;

  return result;
end;
$$;

grant execute on function public.submit_score to anon, authenticated;
