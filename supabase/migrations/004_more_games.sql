-- Migration: leaderboard config for the remaining games (all except "Rank 'Em",
-- which is subjective). Safe to re-run.

insert into public.game_config (game_id, sort_dir, min_score, max_score, label) values
  ('championship-decider', 'desc', 0,   6000,   'Score'),
  ('pit-stop-timer',       'asc',  0,   10000,  'Closest (ms)'),
  ('track-outline',        'desc', 0,   10,     'Correct / 10'),
  ('connections',          'desc', 0,   3650,   'Daily streak'),
  ('career-path',          'desc', 0,   100,    'Score'),
  ('higher-lower',         'desc', 0,   100000, 'Streak'),
  ('predict-driver',       'desc', 0,   100000, 'Streak'),
  ('guess-the-driver',     'desc', 0,   100,    'Score'),
  ('team-radio',           'desc', 0,   1000,   'Score'),
  ('lights-out',           'asc',  80,  10000,  'Reaction (ms)')
on conflict (game_id) do nothing;
