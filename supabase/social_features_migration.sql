-- ==========================================
-- Social Features Migration
-- Friend Requests, Followers, Bio, Profile Views & Gecko Shield
-- ==========================================

-- 1. Add bio and gecko_active columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio VARCHAR(150) DEFAULT '',
ADD COLUMN IF NOT EXISTS gecko_active BOOLEAN DEFAULT FALSE;

-- 2. Create follows table (friend requests + one-way follows)
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

-- 3. Create profile_views table
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for follows

-- Anyone can read follows they are involved in
DROP POLICY IF EXISTS "Users can view their follows" ON follows;
CREATE POLICY "Users can view their follows" ON follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = followed_id);

-- Any authenticated user can send a follow request
DROP POLICY IF EXISTS "Users can send follow requests" ON follows;
CREATE POLICY "Users can send follow requests" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- The followed user can update status (accept)
DROP POLICY IF EXISTS "Users can accept follow requests" ON follows;
CREATE POLICY "Users can accept follow requests" ON follows
  FOR UPDATE USING (auth.uid() = followed_id);

-- Either party can delete a follow (unfollow or reject)
DROP POLICY IF EXISTS "Users can delete follows" ON follows;
CREATE POLICY "Users can delete follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = followed_id);

-- 6. RLS Policies for profile_views

-- Users can see views on their own profile
DROP POLICY IF EXISTS "Users can view their profile views" ON profile_views;
CREATE POLICY "Users can view their profile views" ON profile_views
  FOR SELECT USING (auth.uid() = viewed_id);

-- Any authenticated user can insert a profile view
DROP POLICY IF EXISTS "Users can record profile views" ON profile_views;
CREATE POLICY "Users can record profile views" ON profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
