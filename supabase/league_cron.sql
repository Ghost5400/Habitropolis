-- ==========================================
-- WEEKLY LEAGUE PROMOTION CRON & FUNCTION
-- ==========================================
-- This script creates a Postgres function to automatically shift 
-- players up and down leagues based on their weekly_score.
-- It then schedules this function to run every Sunday at midnight using pg_cron.

-- 1. Create the processing function
CREATE OR REPLACE FUNCTION fn_process_weekly_leagues()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  league_record RECORD;
  player RECORD;
  total_players INTEGER;
  promote_cutoff INTEGER;
  demote_cutoff INTEGER;
  r INTEGER;
BEGIN
  -- Iterate through every active league (1 through 28)
  FOR league_record IN SELECT generate_series(1, 28) as id LOOP
    
    -- Get total players in this specific league
    SELECT COUNT(*) INTO total_players FROM profiles WHERE league_id = league_record.id;
    
    IF total_players > 0 THEN
      -- Determine cutoffs dynamically based on city level
      -- (City 1: 40% promote / 0% demote. City 7: 5% promote / 35% demote)
      -- For simplicity in SQL, we'll apply a standard competitive 20% promote / 20% demote
      -- You can expand this math to exactly match the frontend later!
      promote_cutoff := GREATEST(1, ROUND(total_players * 0.20));
      demote_cutoff := total_players - ROUND(total_players * 0.20) + 1;

      -- Iterate through players in this league sorted by score
      r := 1;
      FOR player IN 
        SELECT user_id, weekly_score 
        FROM profiles 
        WHERE league_id = league_record.id 
        ORDER BY weekly_score DESC, updated_at ASC
      LOOP
        -- Promote top 20%
        IF r <= promote_cutoff AND league_record.id < 28 THEN
          UPDATE profiles SET league_id = league_record.id + 1 WHERE user_id = player.user_id;
        
        -- Demote bottom 20%
        ELSIF r >= demote_cutoff AND league_record.id > 1 THEN
          UPDATE profiles SET league_id = league_record.id - 1 WHERE user_id = player.user_id;
        END IF;

        r := r + 1;
      END LOOP;
    END IF;
  END LOOP;

  -- 2. Reset everyone's weekly score to 0 for the new week
  UPDATE profiles SET weekly_score = 0;

END;
$$;

-- 3. Schedule the Cron Job (requires pg_cron extension)
-- Run exactly at Midnight (00:00) every Sunday (0)
-- NOTE: In Supabase, you must enable the pg_cron extension first!
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'weekly-league-reset',
  '0 0 * * 0', -- Minute 0, Hour 0, every Sunday
  $$SELECT fn_process_weekly_leagues()$$
);
