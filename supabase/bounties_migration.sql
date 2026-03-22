-- Migration to add Daily Bounties and Tiger Tokens
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiger_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_bounties JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_bounty_date DATE;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
