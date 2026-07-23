const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://avskaagaxwhjneuhlaxj.supabase.co';
const supabaseKey = 'sb_publishable_t3yaOzgQd66Fl1Lybyp1AQ_0NFWpNN3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const game = {
    id: crypto.randomUUID(),
    title: 'خمن الدولة',
    icon_name: 'Globe',
    view_id: 'MAP_GUESSER',
    is_primary: false,
    is_visible: true,
    has_obs: true,
    is_coming_soon: false,
    coming_soon_text: 'قريباً',
    position: 26,
  };

  const { data, error } = await supabase
    .from('games')
    .upsert(game, { onConflict: 'view_id' });

  if (error) {
    console.error('Error inserting game:', error);
  } else {
    console.log('Game inserted successfully:', data);
  }
}

main();
