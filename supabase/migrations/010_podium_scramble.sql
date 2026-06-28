-- Migration: leaderboard config for "Podium Scramble" — reorder a scrambled
-- podium (P1/P2/P3) into the correct finishing order across 6 races. Score =
-- total positions off + a sub-1 time fraction as a tiebreak → ascending (lower
-- is better). Max = 6 races × 4 positions off + <1 time = under 25. Safe to re-run.

insert into public.game_config (game_id, sort_dir, min_score, max_score, label) values
  ('podium-scramble', 'asc', 0, 25, 'Positions off')
on conflict (game_id) do nothing;
