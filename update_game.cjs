const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://avskaagaxwhjneuhlaxj.supabase.co';
const supabaseKey = 'sb_publishable_t3yaOzgQd66Fl1Lybyp1AQ_0NFWpNN3'; // ANON/PUBLISHABLE KEY
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('games')
    .update({ is_visible: true })
    .eq('view_id', 'LETTER_GAME');

  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Successfully updated LETTER_GAME to be visible:", data);
  }
}

run();
