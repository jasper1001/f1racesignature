-- Migration: leaderboard config for "Name That Lap" — guess the F1 circuit from
-- its racing line. Accuracy-based (correct out of 10) → descending. Safe to re-run.

insert into public.game_config (game_id, sort_dir, min_score, max_score, label) values
  ('name-that-lap', 'desc', 0, 10, 'Correct / 10')
on conflict (game_id) do nothing;
