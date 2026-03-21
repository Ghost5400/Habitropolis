-- ==========================================
-- Engagement Update (Profiles & Social Cities)
-- ==========================================

-- 1. Ensure columns exist on profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city_layout JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure Row Level Security allows users to read ALL profiles 
-- (Required for Leaderboard and Visit City features)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 3. Ensure users can update their OWN profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Ensure we can read other users' habits/buildings/decorations for PublicCityPage
-- Habits
DROP POLICY IF EXISTS "Habits are viewable by everyone" ON habits;
CREATE POLICY "Habits are viewable by everyone" ON habits
  FOR SELECT USING (true);

-- City Buildings
DROP POLICY IF EXISTS "City Buildings are viewable by everyone" ON city_buildings;
CREATE POLICY "City Buildings are viewable by everyone" ON city_buildings
  FOR SELECT USING (true);

-- User Decorations
DROP POLICY IF EXISTS "User Decorations are viewable by everyone" ON user_decorations;
CREATE POLICY "User Decorations are viewable by everyone" ON user_decorations
  FOR SELECT USING (true);
  
-- 5. Insert Gacha Legendary Decorations
-- These have a native price of 99999 so they can't be bought directly.
INSERT INTO decorations (id, name, category, price_coins, image_key) VALUES
('22222222-0000-0000-0000-000000000001', 'Golden Trophy', 'legendary', 99999, 'golden-trophy'),
('22222222-0000-0000-0000-000000000002', 'Neon Ferris Wheel', 'legendary', 99999, 'ferris-wheel'),
('22222222-0000-0000-0000-000000000003', 'Cyber Monolith', 'legendary', 99999, 'cyber-monolith')
ON CONFLICT (id) DO NOTHING;
