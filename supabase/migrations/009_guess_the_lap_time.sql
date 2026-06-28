-- Migration: leaderboard config for "Guess the Lap Time" — estimate a lap's time
-- from its racing line. Score = total milliseconds off across 5 laps → ascending
-- (lower is better). Safe to re-run.

insert into public.game_config (game_id, sort_dir, min_score, max_score, label) values
  ('guess-the-lap-time', 'asc', 0, 400000, 'Total off (ms)')
on conflict (game_id) do nothing;
