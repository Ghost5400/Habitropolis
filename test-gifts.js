import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testGifts() {
  const { data, error } = await supabase.from('user_gifts').select('*').limit(1);
  if (error) {
    console.error("SQL ERROR:", error);
  } else {
    console.log("SQL SUCCESS. Table exists.");
    console.log("Data:", data);
  }
}

testGifts();
