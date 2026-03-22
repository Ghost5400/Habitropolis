-- Run this script FIRST:
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_title VARCHAR DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unlocked_titles JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS city_theme VARCHAR DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS unlocked_themes JSONB DEFAULT '["default"]'::jsonb;
