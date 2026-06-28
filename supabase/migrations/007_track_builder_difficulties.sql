-- Migration: separate Track Builder leaderboards per difficulty. The base
-- 'track-builder' board stays the Pro (4×4) board; Rookie (3×3) and Elite (5×5)
-- get their own boards so times only compete against the same grid size.
-- Time-based → ascending, score is milliseconds. Safe to re-run.

insert into public.game_config (game_id, sort_dir, min_score, max_score, label) values
  ('track-builder-rookie', 'asc', 0, 600000, 'Build time (ms)'),
  ('track-builder-elite',  'asc', 0, 900000, 'Build time (ms)')
on conflict (game_id) do nothing;
