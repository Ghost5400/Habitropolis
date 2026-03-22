-- ==========================================
-- Building Rework + League Cycle Patch
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add settlement_level and league_cycle_start to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS settlement_level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS league_cycle_start TIMESTAMPTZ DEFAULT NOW();

-- 2. Remove floors from city_buildings (no longer needed)
ALTER TABLE city_buildings
  DROP COLUMN IF EXISTS floors,
  DROP COLUMN IF EXISTS golden_stars;

-- 3. Seed settlement_level for existing users from their current league
UPDATE profiles p
SET settlement_level = l.city_level
FROM leagues l
WHERE p.league_id = l.id;

-- 4. Monthly settlement snapshot function
-- Locks in the current city_level as settlement_level on 1st of each month
CREATE OR REPLACE FUNCTION fn_update_settlement_levels()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles p
  SET settlement_level = l.city_level
  FROM leagues l
  WHERE p.league_id = l.id;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_update_settlement_levels() TO authenticated;

-- 5. Update process_weekly_leaderboards to also reset league_cycle_start
CREATE OR REPLACE FUNCTION process_weekly_leaderboards()
RETURNS void AS $$
DECLARE
  grp_row RECORD;
  usr_row RECORD;
  rank_num INTEGER;
  grp_size INTEGER;
  city_lvl INTEGER;
  p_pct NUMERIC;
  d_pct NUMERIC;
  promote_cutoff INTEGER;
  demote_cutoff INTEGER;
  demote_count INTEGER;
  new_league INTEGER;
BEGIN
  FOR grp_row IN (
    SELECT DISTINCT leaderboard_group_id, league_id 
    FROM profiles 
    WHERE leaderboard_group_id IS NOT NULL
  ) LOOP
    SELECT COUNT(*) INTO grp_size
    FROM profiles
    WHERE leaderboard_group_id = grp_row.leaderboard_group_id
      AND league_id = grp_row.league_id;

    city_lvl := FLOOR((grp_row.league_id - 1) / 4) + 1;

    IF city_lvl = 1 THEN p_pct := 0.40; d_pct := 0.00;
    ELSIF city_lvl = 2 THEN p_pct := 0.30; d_pct := 0.15;
    ELSIF city_lvl = 3 THEN p_pct := 0.25; d_pct := 0.20;
    ELSIF city_lvl = 4 THEN p_pct := 0.20; d_pct := 0.20;
    ELSIF city_lvl = 5 THEN p_pct := 0.15; d_pct := 0.25;
    ELSIF city_lvl = 6 THEN p_pct := 0.10; d_pct := 0.30;
    ELSE p_pct := 0.05; d_pct := 0.35;
    END IF;

    promote_cutoff := ROUND(grp_size * p_pct);
    demote_count := ROUND(grp_size * d_pct);
    IF promote_cutoff = 0 AND grp_size >= 3 THEN promote_cutoff := 1; END IF;
    IF demote_count = 0 THEN demote_cutoff := grp_size + 1;
    ELSE demote_cutoff := grp_size - demote_count + 1;
    END IF;

    rank_num := 1;
    FOR usr_row IN 
      SELECT user_id, weekly_score, league_id 
      FROM profiles 
      WHERE leaderboard_group_id = grp_row.leaderboard_group_id 
        AND league_id = grp_row.league_id
      ORDER BY weekly_score DESC, display_name ASC
    LOOP
      new_league := usr_row.league_id;
      IF rank_num <= promote_cutoff AND usr_row.league_id < 28 THEN
        new_league := usr_row.league_id + 1;
      ELSIF rank_num >= demote_cutoff AND usr_row.league_id > 1 THEN
        new_league := usr_row.league_id - 1;
      END IF;

      UPDATE profiles 
      SET 
        league_id = new_league, 
        weekly_score = 0,
        leaderboard_group_id = NULL,
        league_cycle_start = NOW()  -- Reset cycle start on weekly reset
      WHERE user_id = usr_row.user_id;

      rank_num := rank_num + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION process_weekly_leaderboards() TO anon, authenticated;

-- 6. Schedule cron jobs (requires pg_cron extension)
-- Weekly league reset: every Sunday midnight
SELECT cron.schedule('weekly-league-reset', '0 0 * * 0', 'SELECT process_weekly_leaderboards()');
-- Monthly settlement update: 1st of every month midnight
SELECT cron.schedule('monthly-settlement-update', '0 0 1 * *', 'SELECT fn_update_settlement_levels()');

NOTIFY pgrst, 'reload schema';
