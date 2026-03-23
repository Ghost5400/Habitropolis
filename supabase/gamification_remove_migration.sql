-- Gamification Revert Migration
-- Run this to completely remove the database traces of the 4 features

DROP TABLE IF EXISTS duels CASCADE;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS active_title,
  DROP COLUMN IF EXISTS unlocked_titles,
  DROP COLUMN IF EXISTS city_theme,
  DROP COLUMN IF EXISTS unlocked_themes;

NOTIFY pgrst, 'reload schema';
