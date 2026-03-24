-- Migration: Add Mascot and Retention columns to profiles

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS parth_hunger INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS parth_outfits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parth_equipped TEXT,
ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS xp_boost_until TIMESTAMPTZ;

-- Ensure hunger stays between 0 and 100
ALTER TABLE profiles
ADD CONSTRAINT parth_hunger_range CHECK (parth_hunger >= 0 AND parth_hunger <= 100);
