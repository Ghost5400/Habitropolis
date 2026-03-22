-- Gamification Updates: Titles, Themes, Duels

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_title VARCHAR DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unlocked_titles JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS city_theme VARCHAR DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS unlocked_themes JSONB DEFAULT '["default"]'::jsonb;

CREATE TABLE IF NOT EXISTS duels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenger_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  defender_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  wager INTEGER DEFAULT 50,
  status VARCHAR DEFAULT 'pending', -- pending, active, completed, declined
  challenger_score INTEGER DEFAULT 0,
  defender_score INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  winner_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed', 'declined'))
);

-- RLS for Duels
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own duels" 
  ON duels FOR SELECT 
  USING (auth.uid() = challenger_id OR auth.uid() = defender_id);

CREATE POLICY "Users can create duels as challenger" 
  ON duels FOR INSERT 
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update duels they are part of" 
  ON duels FOR UPDATE 
  USING (auth.uid() = challenger_id OR auth.uid() = defender_id);

NOTIFY pgrst, 'reload schema';
