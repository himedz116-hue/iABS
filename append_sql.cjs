const fs = require('fs');
const filepath = 'C:/Users/MOH/.gemini/antigravity/brain/7fd37f07-aa4e-4fae-b0ff-b582ca911481/higher_lower_init.sql';
let sql = fs.readFileSync(filepath, 'utf8');
sql += `
-- Insert the game into the games table
INSERT INTO public.games (title, icon_name, view_id, is_primary, is_visible, position)
VALUES ('أعلى أم أقل', 'ArrowUp', 'HIGHER_LOWER', true, true, 1);
`;
fs.writeFileSync(filepath, sql, 'utf8');
