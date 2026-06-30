const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://avskaagaxwhjneuhlaxj.supabase.co';
const supabaseKey = 'sb_publishable_t3yaOzgQd66Fl1Lybyp1AQ_0NFWpNN3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: existing } = await supabase.from('games').select('*').eq('view_id', 'LETTER_GAME');
  
  if (existing && existing.length > 0) {
    console.log("Already exists!");
    return;
  }

  const { data, error } = await supabase
    .from('games')
    .insert([{
      id: crypto.randomUUID(),
      title: 'حروف مع حمودي',
      icon_name: 'Type',
      view_id: 'LETTER_GAME',
      is_primary: false,
      is_visible: true,
      has_obs: true,
      is_coming_soon: false,
      coming_soon_text: 'قريباً',
      position: 24,
    }]);

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully inserted LETTER_GAME:", data);
  }
}

run();
