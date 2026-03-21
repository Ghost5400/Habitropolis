-- ==========================================
-- Add Username and Avatar to Profiles
-- ==========================================
-- This script updates the profiles table to support custom usernames and avatars

-- Step 1: Add the columns if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS avatar_id text DEFAULT 'default';

-- Step 2: Seed existing users with a default username based on their email
UPDATE profiles 
SET username = split_part(email, '@', 1) 
WHERE username IS NULL OR username = '';

-- Note: We can add a unique constraint here if desired, but for an MVP, 
-- simple display names are fine and less complex to manage.
-- ALTER TABLE profiles ADD CONSTRAINT unique_username UNIQUE (username);

-- Step 3: Ensure Row Level Security allows users to read ALL profiles 
-- (They need this for the Leaderboard and Visit City features anyway)
-- Assuming a policy "Profiles are viewable by everyone" already exists.
-- If not, here it is:
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Step 4: Ensure users can update their OWN profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
