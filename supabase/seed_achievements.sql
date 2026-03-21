-- ==============================================
-- RUN THIS IN SUPABASE SQL EDITOR TO ADD ACHIEVEMENTS
-- ==============================================

-- 1. Optional: clear existing achievements to avoid duplicates if re-running
-- (Warning: this will cascade delete user_achievements if you have any)
-- DELETE FROM achievements; 

-- 2. Insert the 12 core achievements
INSERT INTO achievements (id, name, description, icon, condition_type, condition_value, reward_coins)
VALUES
  (gen_random_uuid(), 'First Step', 'Complete your first habit', '👣', 'habits_completed', 1, 10),
  (gen_random_uuid(), 'Getting Started', 'Complete 10 habits', '🌱', 'habits_completed', 10, 25),
  (gen_random_uuid(), 'Week Warrior', 'Reach a 7-day streak', '🔥', 'streak', 7, 50),
  (gen_random_uuid(), 'Month Master', 'Reach a 30-day streak', '👑', 'streak', 30, 200),
  (gen_random_uuid(), 'City Planner', 'Own 5 buildings', '🏗️', 'buildings', 5, 100),
  (gen_random_uuid(), 'Skyscraper', 'Reach max floors on a building', '🏢', 'max_floors', 1, 100),
  (gen_random_uuid(), 'Golden Collection', 'Earn 5 golden stars', '⭐', 'golden_stars', 5, 300),
  (gen_random_uuid(), 'Decorator', 'Buy your first decoration', '🎨', 'decorations', 1, 20),
  (gen_random_uuid(), 'Hydration Hero', 'Complete a counter habit 30 times', '💧', 'counter_completions', 30, 75),
  (gen_random_uuid(), 'Bad Habit Breaker', 'Resist a bad habit for 30 days', '💪', 'bad_habit_streak', 30, 150),
  (gen_random_uuid(), 'Coin Collector', 'Earn 500 coins total', '💰', 'total_coins', 500, 50),
  (gen_random_uuid(), 'Shield Master', 'Use 3 shields', '🛡️', 'shields_used', 3, 30)
ON CONFLICT DO NOTHING;

-- Force reload schema just to be safe
NOTIFY pgrst, 'reload schema';
