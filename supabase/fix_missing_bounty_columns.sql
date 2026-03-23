-- Add missing bounty tracking columns to profiles to fix 400 errors
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS daily_bounties JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_bounty_date TEXT,
ADD COLUMN IF NOT EXISTS tiger_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;

NOTIFY pgrst, 'reload schema';
