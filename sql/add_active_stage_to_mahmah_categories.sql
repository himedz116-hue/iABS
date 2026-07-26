ALTER TABLE mahmah_categories 
ADD COLUMN IF NOT EXISTS active_stage INTEGER DEFAULT 1;

UPDATE mahmah_categories SET active_stage = 1 WHERE active_stage IS NULL;
