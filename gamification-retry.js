import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const getQuery = () => `
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
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own duels') THEN
          CREATE POLICY "Users can view their own duels" ON duels FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = defender_id);
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create duels as challenger') THEN
          CREATE POLICY "Users can create duels as challenger" ON duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update duels they are part of') THEN
          CREATE POLICY "Users can update duels they are part of" ON duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = defender_id);
      END IF;
  END
  $$;

  NOTIFY pgrst, 'reload schema';
`;

// It's not possible to run raw SQL natively through the @supabase/supabase-js client without a PostgreSQL driver (like 'pg' or 'postgres').
// BUT this is for Habitropolis, which the user can just copy-paste if needed.
// Wait, the user already copy-pasted the previous SQL into their web browser Supabase SQL Editor!
// I'll just write the query to `gamification_migration.sql` cleanly and tell them to run it again.
