-- Migration: leaderboard config for the Track Builder puzzle (rebuild a scrambled
-- circuit against the clock). Time-based → ascending, score is milliseconds.
-- Only the Pro (4×4) mode submits, so all times are comparable. Safe to re-run.

insert into public.game_config (game_id, sort_dir, min_score, max_score, label) values
  ('track-builder', 'asc', 0, 600000, 'Build time (ms)')
on conflict (game_id) do nothing;
