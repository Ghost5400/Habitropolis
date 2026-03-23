-- Ensure league_cycle_start column exists
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS league_cycle_start TIMESTAMPTZ DEFAULT NULL;

-- Initialize it for all users who don't have it yet (set to this Monday)
UPDATE profiles
SET league_cycle_start = date_trunc('week', NOW() + INTERVAL '1 day') - INTERVAL '1 day'
WHERE league_cycle_start IS NULL;

NOTIFY pgrst, 'reload schema';
