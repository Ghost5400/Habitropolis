-- Migration to add Leagues & Leaderboard system

-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city_level INTEGER NOT NULL
);

-- Insert the 28 unique leagues
INSERT INTO leagues (id, name, city_level) VALUES
(1, 'Dirt League', 1),
(2, 'Wood League', 1),
(3, 'Stone League', 1),
(4, 'Brick League', 1),
(5, 'Copper League', 2),
(6, 'Iron League', 2),
(7, 'Steel League', 2),
(8, 'Cobalt League', 2),
(9, 'Amber League', 3),
(10, 'Topaz League', 3),
(11, 'Quartz League', 3),
(12, 'Pearl League', 3),
(13, 'Jade League', 4),
(14, 'Sapphire League', 4),
(15, 'Emerald League', 4),
(16, 'Ruby League', 4),
(17, 'Bronze League', 5),
(18, 'Silver League', 5),
(19, 'Gold League', 5),
(20, 'Platinum League', 5),
(21, 'Obsidian League', 6),
(22, 'Neon League', 6),
(23, 'Plasma League', 6),
(24, 'Titanium League', 6),
(25, 'Diamond League', 7),
(26, 'Apex League', 7),
(27, 'Quantum League', 7),
(28, 'Celestial League', 7)
ON CONFLICT DO NOTHING;

-- Add tracking columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id),
ADD COLUMN IF NOT EXISTS weekly_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS leaderboard_group_id UUID DEFAULT gen_random_uuid();

-- Create global function to process leaderboard weekly
CREATE OR REPLACE FUNCTION process_weekly_leaderboards()
RETURNS void AS $$
DECLARE
  grp_row RECORD;
  usr_row RECORD;
  rank_num INTEGER;
  new_league INTEGER;
BEGIN
  -- We group by leaderboard_group_id and league_id
  FOR grp_row IN (SELECT DISTINCT leaderboard_group_id, league_id FROM profiles) LOOP
    rank_num := 1;
    FOR usr_row IN 
      SELECT user_id, weekly_score, league_id 
      FROM profiles 
      WHERE leaderboard_group_id = grp_row.leaderboard_group_id AND league_id = grp_row.league_id
      ORDER BY weekly_score DESC, display_name ASC
    LOOP
      new_league := usr_row.league_id;
      
      -- Promote Top 7 (Rank 1-7), Demote Bottom 7 (Rank 24-30) assuming group size is ~30
      IF rank_num <= 7 AND usr_row.league_id < 28 THEN
        new_league := usr_row.league_id + 1;
      ELSIF rank_num >= 24 AND usr_row.league_id > 1 THEN
        new_league := usr_row.league_id - 1;
      END IF;

      -- Update the profile
      UPDATE profiles 
      SET 
        league_id = new_league, 
        weekly_score = 0,
        leaderboard_group_id = gen_random_uuid() 
      WHERE user_id = usr_row.user_id;

      rank_num := rank_num + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Uncomment the line below and run it in Supabase SQL editor ONLY if you have pg_cron enabled
-- SELECT cron.schedule('weekly-reset', '0 0 * * 0', 'SELECT process_weekly_leaderboards()');
