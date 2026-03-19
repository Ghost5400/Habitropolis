-- Supabase Schema for Habitropolis
-- All tables have RLS policies scoped to auth.uid()

-- Profiles table
CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  coins INTEGER DEFAULT 0,
  premium BOOLEAN DEFAULT FALSE
);

-- Habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('goal', 'timer', 'counter', 'bad_habit_stopper')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  target_value INTEGER,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit logs table
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streaks table
CREATE TABLE streaks (
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_at DATE,
  PRIMARY KEY (habit_id, user_id)
);

-- Shields table
CREATE TABLE shields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  remaining_days INTEGER DEFAULT 0,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- City buildings table
CREATE TABLE city_buildings (
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  floors INTEGER DEFAULT 0,
  golden_stars INTEGER DEFAULT 0,
  decorations JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decorations table
CREATE TABLE decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_coins INTEGER DEFAULT 0,
  price_usd DECIMAL(10,2) DEFAULT 0.00,
  image_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User decorations table
CREATE TABLE user_decorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  decoration_id UUID REFERENCES decorations(id) ON DELETE CASCADE NOT NULL,
  building_id UUID REFERENCES city_buildings(habit_id) ON DELETE SET NULL,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'earn', 'refund')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('coins', 'usd')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shields ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_decorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can only see/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Habits: Users can only see/manage their own habits
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Habit logs: Users can only see/manage their own habit logs
CREATE POLICY "Users can view own habit logs" ON habit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit logs" ON habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit logs" ON habit_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habit logs" ON habit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Streaks: Users can only see/manage their own streaks
CREATE POLICY "Users can view own streaks" ON streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Shields: Users can only see/manage their own shields
CREATE POLICY "Users can view own shields" ON shields
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shields" ON shields
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shields" ON shields
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shields" ON shields
  FOR DELETE USING (auth.uid() = user_id);

-- City buildings: Users can only see/manage their own city buildings
CREATE POLICY "Users can view own city buildings" ON city_buildings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own city buildings" ON city_buildings
  FOR UPDATE USING (auth.uid() = user_id);

-- Decorations: Anyone can view decorations, but only admins can modify
CREATE POLICY "Anyone can view decorations" ON decorations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage decorations" ON decorations
  FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- User decorations: Users can only see/manage their own decorations
CREATE POLICY "Users can view own user decorations" ON user_decorations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user decorations" ON user_decorations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user decorations" ON user_decorations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user decorations" ON user_decorations
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements: Anyone can view achievements
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT USING (true);

-- User achievements: Users can only see/manage their own achievements
CREATE POLICY "Users can view own user achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions: Users can only see/manage their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);