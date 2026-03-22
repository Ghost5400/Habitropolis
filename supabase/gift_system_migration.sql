-- Migration to add Friends Gifting System
CREATE TABLE IF NOT EXISTS user_gifts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  item_type VARCHAR NOT NULL DEFAULT 'decoration',
  item_id VARCHAR NOT NULL, -- UUID of the DECORATION_CATALOG item
  message TEXT,
  is_opened BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE user_gifts ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can insert a gift if they are the sender
CREATE POLICY "Users can send gifts" 
  ON user_gifts FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- 2. You can read gifts sent to you
CREATE POLICY "Users can read gifts sent to them" 
  ON user_gifts FOR SELECT 
  USING (auth.uid() = receiver_id);

-- 3. You can read gifts you sent
CREATE POLICY "Users can read gifts they sent" 
  ON user_gifts FOR SELECT 
  USING (auth.uid() = sender_id);

-- 4. You can only update gifts sent to you (e.g. marking as opened)
CREATE POLICY "Users can update their own received gifts" 
  ON user_gifts FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
