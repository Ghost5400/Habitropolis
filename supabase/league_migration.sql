-- Migration to add Leagues & Leaderboard system
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. Create leagues reference table
-- ============================================
CREATE TABLE IF NOT EXISTS leagues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city_level INTEGER NOT NULL
);

-- Enable RLS on leagues (public read)
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read leagues" ON leagues;
CREATE POLICY "Anyone can read leagues" ON leagues FOR SELECT USING (true);

-- Insert the 28 unique leagues
INSERT INTO leagues (id, name, city_level) VALUES
(1, 'Dirt League', 1),
(2, 'Wood League', 1),
(3, 'Stone League', 1),
(4, 'Brick League', 1),
(5, 'Copper League', 2),
(6, 'Iron League', 2),
(7, 'Steel League', 2),
(8, 'Cobalt League', 2),
(9, 'Amber League', 3),
(10, 'Topaz League', 3),
(11, 'Quartz League', 3),
(12, 'Pearl League', 3),
(13, 'Jade League', 4),
(14, 'Sapphire League', 4),
(15, 'Emerald League', 4),
(16, 'Ruby League', 4),
(17, 'Bronze League', 5),
(18, 'Silver League', 5),
(19, 'Gold League', 5),
(20, 'Platinum League', 5),
(21, 'Obsidian League', 6),
(22, 'Neon League', 6),
(23, 'Plasma League', 6),
(24, 'Titanium League', 6),
(25, 'Diamond League', 7),
(26, 'Apex League', 7),
(27, 'Quantum League', 7),
(28, 'Celestial League', 7)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. Add tracking columns to profiles
-- ============================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id),
ADD COLUMN IF NOT EXISTS weekly_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leaderboard_group_id UUID;

-- ============================================
-- 3. RLS: Allow users to see OTHER profiles in their same bracket
--    This is essential for the leaderboard to work!
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in same bracket" ON profiles;

-- Users can see their own profile OR other profiles in the same bracket
CREATE POLICY "Users can view profiles in same bracket" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    leaderboard_group_id IN (
      SELECT p.leaderboard_group_id FROM profiles p WHERE p.user_id = auth.uid()
    )
  );

-- Keep the existing update policy (own profile only)
-- (already exists from schema.sql, this is a safety net)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow insert for new profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. RPC: Assign a user to a bracket
--    Finds an existing bracket in the same league with < 30 users,
--    or creates a new bracket UUID.
-- ============================================
CREATE OR REPLACE FUNCTION assign_user_bracket(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_league INTEGER;
  v_group UUID;
  v_current_group UUID;
BEGIN
  -- Get the user's current league and group
  SELECT league_id, leaderboard_group_id INTO v_league, v_current_group
  FROM profiles WHERE user_id = p_user_id;

  -- If they already have a group, check it's not orphaned (still has participants)
  IF v_current_group IS NOT NULL THEN
    -- Check if user's current group has at least 2 people
    IF (SELECT COUNT(*) FROM profiles WHERE leaderboard_group_id = v_current_group AND league_id = v_league) >= 2 THEN
      RETURN v_current_group;
    END IF;
  END IF;

  -- Find an open bracket in this league with fewer than 30 people
  SELECT leaderboard_group_id INTO v_group
  FROM profiles
  WHERE league_id = v_league
    AND leaderboard_group_id IS NOT NULL
    AND user_id != p_user_id
  GROUP BY leaderboard_group_id
  HAVING COUNT(*) < 30
  ORDER BY COUNT(*) DESC  -- prefer fuller groups for better competition
  LIMIT 1;

  -- If no open bracket found, create a new one
  IF v_group IS NULL THEN
    v_group := gen_random_uuid();
  END IF;

  -- Assign this user to the bracket
  UPDATE profiles SET leaderboard_group_id = v_group WHERE user_id = p_user_id;

  RETURN v_group;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. RPC: Process weekly leaderboards
--    Ranks users within each bracket, promotes top ~23%, demotes bottom ~23%
-- ============================================
CREATE OR REPLACE FUNCTION process_weekly_leaderboards()
RETURNS void AS $$
DECLARE
  grp_row RECORD;
  usr_row RECORD;
  rank_num INTEGER;
  grp_size INTEGER;
  promote_cutoff INTEGER;
  demote_cutoff INTEGER;
  new_league INTEGER;
BEGIN
  -- Process each (group, league) combination
  FOR grp_row IN (
    SELECT DISTINCT leaderboard_group_id, league_id 
    FROM profiles 
    WHERE leaderboard_group_id IS NOT NULL
  ) LOOP
    -- Count users in this bracket
    SELECT COUNT(*) INTO grp_size
    FROM profiles
    WHERE leaderboard_group_id = grp_row.leaderboard_group_id
      AND league_id = grp_row.league_id;

    -- Calculate cutoffs (top ~23% promote, bottom ~23% demote)
    promote_cutoff := GREATEST(1, FLOOR(grp_size * 0.23));
    demote_cutoff := grp_size - GREATEST(1, FLOOR(grp_size * 0.23)) + 1;

    rank_num := 1;
    FOR usr_row IN 
      SELECT user_id, weekly_score, league_id 
      FROM profiles 
      WHERE leaderboard_group_id = grp_row.leaderboard_group_id 
        AND league_id = grp_row.league_id
      ORDER BY weekly_score DESC, display_name ASC
    LOOP
      new_league := usr_row.league_id;
      
      -- Promote top ranks (only if not at max league)
      IF rank_num <= promote_cutoff AND usr_row.league_id < 28 THEN
        new_league := usr_row.league_id + 1;
      -- Demote bottom ranks (only if not at min league)
      ELSIF rank_num >= demote_cutoff AND usr_row.league_id > 1 THEN
        new_league := usr_row.league_id - 1;
      END IF;

      -- Update the profile: change league, reset score, clear group (will be reassigned)
      UPDATE profiles 
      SET 
        league_id = new_league, 
        weekly_score = 0,
        leaderboard_group_id = NULL
      WHERE user_id = usr_row.user_id;

      rank_num := rank_num + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Grant permissions so Supabase client can call RPCs
-- ============================================
GRANT EXECUTE ON FUNCTION assign_user_bracket(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_weekly_leaderboards() TO anon, authenticated;

-- ============================================
-- 7. Seed existing profiles with default values
-- ============================================
UPDATE profiles SET league_id = 1 WHERE league_id IS NULL;
UPDATE profiles SET weekly_score = 0 WHERE weekly_score IS NULL;

-- Force Supabase PostgREST to reload the schema cache
-- This is CRITICAL — without it, the API won't see the new columns/functions
NOTIFY pgrst, 'reload schema';

-- ============================================
-- 8. (OPTIONAL) If pg_cron is available, schedule weekly processing
--    Uncomment and run in SQL Editor if pg_cron is enabled:
-- ============================================
-- SELECT cron.schedule('weekly-league-reset', '0 0 * * 0', 'SELECT process_weekly_leaderboards()');
