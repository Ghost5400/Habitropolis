-- Add lifetime XP column to tracking global leaderboards permanently
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS lifetime_xp INTEGER DEFAULT 0;

-- Backfill existing XP from weekly score
UPDATE profiles
SET lifetime_xp = weekly_score
WHERE lifetime_xp = 0 AND weekly_score > 0;

NOTIFY pgrst, 'reload schema';
