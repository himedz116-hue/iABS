const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://avskaagaxwhjneuhlaxj.supabase.co';
const supabaseKey = 'sb_publishable_t3yaOzgQd66Fl1Lybyp1AQ_0NFWpNN3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: existing } = await supabase.from('games').select('*').eq('view_id', 'SAFE_CODE');
  
  if (existing && existing.length > 0) {
    console.log("SAFE_CODE Already exists!");
    return;
  }

  const { data, error } = await supabase
    .from('games')
    .insert([{
      id: crypto.randomUUID(),
      title: 'البنك الآمن',
      icon_name: 'Lock',
      view_id: 'SAFE_CODE',
      is_primary: false,
      is_visible: true,
      has_obs: true,
      is_coming_soon: false,
      coming_soon_text: 'قريباً',
      position: 25,
    }]);

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Successfully inserted SAFE_CODE:", data);
  }
}

run();
