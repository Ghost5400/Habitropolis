-- ==============================================
-- RUN THIS IN SUPABASE SQL EDITOR TO ADD ACHIEVEMENTS
-- ==============================================

-- 1. Optional: clear existing achievements to avoid duplicates if re-running
-- (Warning: this will cascade delete user_achievements if you have any)
DELETE FROM achievements; 

-- 2. Insert the 20 core achievements
INSERT INTO achievements (id, name, description, icon, condition_type, condition_value, reward_coins)
VALUES
  (gen_random_uuid(), 'First Step', 'Complete your first habit', '👣', 'habits_completed', 1, 10),
  (gen_random_uuid(), 'Getting Started', 'Complete 10 habits', '🌱', 'habits_completed', 10, 25),
  (gen_random_uuid(), 'Week Warrior', 'Reach a 7-day streak', '🔥', 'streak', 7, 50),
  (gen_random_uuid(), 'Month Master', 'Reach a 30-day streak', '👑', 'streak', 30, 200),
  (gen_random_uuid(), 'City Planner', 'Own 5 buildings', '🏗️', 'buildings', 5, 100),
  (gen_random_uuid(), 'Skyscraper', 'Max out the floors on any building', '🏢', 'max_floors', 1, 100),
  (gen_random_uuid(), 'Golden Collection', 'Earn 5 golden stars', '⭐', 'golden_stars', 5, 300),
  (gen_random_uuid(), 'Decorator', 'Buy your first decoration', '🎨', 'decorations', 1, 20),
  (gen_random_uuid(), 'Coin Collector', 'Earn 500 coins total', '💰', 'total_coins', 500, 50),
  (gen_random_uuid(), 'Habit Machine', 'Complete 50 habits', '⚙️', 'habits_completed', 50, 75),
  (gen_random_uuid(), 'Century Club', 'Complete 100 habits', '💯', 'habits_completed', 100, 150),
  (gen_random_uuid(), 'Pet Parent', 'Get Parth to Level 5', '🐯', 'parth_level', 5, 100),
  (gen_random_uuid(), 'Tiger Tamer', 'Get Parth to Level 10', '🐅', 'parth_level', 10, 200),
  (gen_random_uuid(), 'Happy Tiger', 'Max out Parth''s happiness, hunger, and hygiene', '😻', 'parth_maxed', 1, 50),
  (gen_random_uuid(), 'Social Butterfly', 'Visit another mayor''s city', '🦋', 'cities_visited', 1, 20),
  (gen_random_uuid(), 'Generous Mayor', 'Send a gift to a friend', '🎁', 'gifts_sent', 1, 30),
  (gen_random_uuid(), 'Lucky Draw', 'Open a Mystery Chest', '🎰', 'chests_opened', 1, 20),
  (gen_random_uuid(), 'Bounty Hunter', 'Claim 10 daily bounties', '🎯', 'bounties_claimed', 10, 75),
  (gen_random_uuid(), 'Loyal Citizen', 'Log in for 7 days straight', '📅', 'login_streak', 7, 100),
  (gen_random_uuid(), 'Rising Star', 'Reach 1000 lifetime XP', '🌟', 'lifetime_xp', 1000, 100)
ON CONFLICT DO NOTHING;

-- Force reload schema just to be safe
NOTIFY pgrst, 'reload schema';
