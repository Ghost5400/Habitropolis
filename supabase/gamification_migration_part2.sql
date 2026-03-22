-- Run this script SECOND:
CREATE TABLE IF NOT EXISTS duels (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  challenger_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  defender_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  wager INTEGER DEFAULT 50,
  status VARCHAR DEFAULT 'pending', 
  challenger_score INTEGER DEFAULT 0,
  defender_score INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  winner_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'completed', 'declined'))
);

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own duels') THEN
      CREATE POLICY "Users can view their own duels" ON duels FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = defender_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create duels as challenger') THEN
      CREATE POLICY "Users can create duels as challenger" ON duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update duels they are part of') THEN
      CREATE POLICY "Users can update duels they are part of" ON duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = defender_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
