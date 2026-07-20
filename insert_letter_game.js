import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.from('games').insert([
    {
      title: 'حروف مع حمودي',
      icon_name: 'Smile',
      view_id: 'LETTER_GAME',
      is_primary: false,
      has_obs: false,
      is_coming_soon: false,
      position: 24
    }
  ]);
  if (error) console.error(error);
  else console.log('Successfully inserted LETTER_GAME');
}
run();
