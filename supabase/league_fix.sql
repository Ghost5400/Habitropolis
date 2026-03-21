-- =============================================
-- QUICK FIX: Run this in Supabase SQL Editor
-- This fixes the missing permissions that prevent
-- the league from working.
-- =============================================

-- 1. Grant RPC call permissions to authenticated users
GRANT EXECUTE ON FUNCTION assign_user_bracket(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_weekly_leaderboards() TO anon, authenticated;

-- 2. Fix the SELECT policy so users can see their bracket-mates
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in same bracket" ON profiles;

CREATE POLICY "Users can view profiles in same bracket" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    leaderboard_group_id IN (
      SELECT p.leaderboard_group_id FROM profiles p WHERE p.user_id = auth.uid()
    )
  );

-- 3. Ensure INSERT policy exists (for new user signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Seed any unfilled league fields
UPDATE profiles SET league_id = 1 WHERE league_id IS NULL;
UPDATE profiles SET weekly_score = 0 WHERE weekly_score IS NULL;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
