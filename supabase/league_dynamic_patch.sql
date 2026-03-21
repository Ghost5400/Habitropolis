-- ==============================================
-- RUN THIS IN SUPABASE SQL EDITOR TO APPLY THE 
-- DYNAMIC NEW DIFFICULTY CURVE FOR PROMOTIONS
-- ==============================================

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
  -- Process each (group, league) combination
  FOR grp_row IN (
    SELECT DISTINCT leaderboard_group_id, league_id 
    FROM profiles 
    WHERE leaderboard_group_id IS NOT NULL
  ) LOOP
    -- Count users in this bracket
    SELECT COUNT(*) INTO grp_size
    FROM profiles
    WHERE leaderboard_group_id = grp_row.leaderboard_group_id
      AND league_id = grp_row.league_id;

    -- Determine city level (1-7)
    city_lvl := FLOOR((grp_row.league_id - 1) / 4) + 1;

    -- Apply dynamic difficulty curve scale
    IF city_lvl = 1 THEN
      p_pct := 0.40; d_pct := 0.00;
    ELSIF city_lvl = 2 THEN
      p_pct := 0.30; d_pct := 0.15;
    ELSIF city_lvl = 3 THEN
      p_pct := 0.25; d_pct := 0.20;
    ELSIF city_lvl = 4 THEN
      p_pct := 0.20; d_pct := 0.20;
    ELSIF city_lvl = 5 THEN
      p_pct := 0.15; d_pct := 0.25;
    ELSIF city_lvl = 6 THEN
      p_pct := 0.10; d_pct := 0.30;
    ELSE
      p_pct := 0.05; d_pct := 0.35;
    END IF;

    -- Calculate specific cutoffs
    promote_cutoff := ROUND(grp_size * p_pct);
    demote_count := ROUND(grp_size * d_pct);
    
    -- Ensure at least 1 person promotes if group size is >= 3
    IF promote_cutoff = 0 AND grp_size >= 3 THEN 
      promote_cutoff := 1; 
    END IF;

    IF demote_count = 0 THEN 
      demote_cutoff := grp_size + 1; -- nobody demotes
    ELSE
      demote_cutoff := grp_size - demote_count + 1;
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
      
      -- Promote top ranks (only if not at max league)
      IF rank_num <= promote_cutoff AND usr_row.league_id < 28 THEN
        new_league := usr_row.league_id + 1;
      -- Demote bottom ranks (only if not at min league)
      ELSIF rank_num >= demote_cutoff AND usr_row.league_id > 1 THEN
        new_league := usr_row.league_id - 1;
      END IF;

      -- Update the profile: change league, reset score, clear group (will be reassigned)
      UPDATE profiles 
      SET 
        league_id = new_league, 
        weekly_score = 0,
        leaderboard_group_id = NULL
      WHERE user_id = usr_row.user_id;

      rank_num := rank_num + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Don't forget to restore calling permissions
GRANT EXECUTE ON FUNCTION process_weekly_leaderboards() TO anon, authenticated;
