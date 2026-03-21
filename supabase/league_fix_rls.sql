-- =============================================
-- INFINITE RECURSION FIX: Run this in Supabase SQL Editor
-- =============================================

-- 1. Drop the recursive policy that caused the error
DROP POLICY IF EXISTS "Users can view profiles in same bracket" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 2. Create a function that bypasses RLS to get the bracket ID safely
CREATE OR REPLACE FUNCTION get_auth_user_bracket()
RETURNS UUID AS $$
  SELECT leaderboard_group_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Recreate the policy using the safe function
CREATE POLICY "Users can view profiles in same bracket" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    leaderboard_group_id = get_auth_user_bracket()
  );

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
