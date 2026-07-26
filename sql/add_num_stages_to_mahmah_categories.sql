-- ============================================
-- Add num_stages to mahmah_categories
-- Admin sets how many stages each category has
-- ============================================

-- 1. Add the column
ALTER TABLE mahmah_categories 
ADD COLUMN IF NOT EXISTS num_stages INTEGER DEFAULT 1;

-- 2. Auto-calculate existing categories based on question count
UPDATE mahmah_categories 
SET num_stages = GREATEST(1, FLOOR((
  SELECT COUNT(*) FROM mahmah_questions 
  WHERE mahmah_questions.category_id = mahmah_categories.id
) / 6));

-- 3. Ensure at least 1
UPDATE mahmah_categories SET num_stages = 1 WHERE num_stages IS NULL OR num_stages < 1;
