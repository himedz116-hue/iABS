const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://avskaagaxwhjneuhlaxj.supabase.co';
const supabaseKey = 'sb_publishable_t3yaOzgQd66Fl1Lybyp1AQ_0NFWpNN3';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: games } = await supabase.from('games').select('*').order('position');
  
  let pos = 1;
  for (const game of games) {
    if (game.view_id === 'LETTER_GAME') continue;
    
    if (pos === 4) {
      await supabase.from('games').update({ position: pos }).eq('view_id', 'LETTER_GAME');
      pos++;
    }
    
    await supabase.from('games').update({ position: pos }).eq('id', game.id);
    pos++;
  }

  console.log("Positions updated successfully! LETTER_GAME is now at position 4.");
}

run();
