-- ============================================
-- Add order_number to mahmah_questions
-- Determines position within a stage (1-6)
-- Questions 1-6 = Stage 1, 7-12 = Stage 2, etc.
-- ============================================

-- 1. Add the column
ALTER TABLE mahmah_questions 
ADD COLUMN IF NOT EXISTS order_number INTEGER;

-- 2. Update existing questions with sequential order per category
-- Each category gets its own sequence: 1, 2, 3, 4, 5, 6, 1, 2, 3...
DO $$
DECLARE
  rec RECORD;
  counter INTEGER;
BEGIN
  FOR rec IN 
    SELECT DISTINCT category_id FROM mahmah_questions ORDER BY category_id
  LOOP
    counter := 1;
    UPDATE mahmah_questions 
    SET order_number = sub.new_order
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY points ASC, created_at ASC) as new_order
      FROM mahmah_questions
      WHERE category_id = rec.category_id
    ) sub
    WHERE mahmah_questions.id = sub.id;
    -- Reset counter isn't needed since ROW_NUMBER handles it
  END LOOP;
END $$;

-- Fallback: assign order_number = 1 for any NULLs
UPDATE mahmah_questions SET order_number = 1 WHERE order_number IS NULL;

-- 3. Set NOT NULL with default
ALTER TABLE mahmah_questions 
ALTER COLUMN order_number SET DEFAULT 1;

ALTER TABLE mahmah_questions 
ALTER COLUMN order_number SET NOT NULL;
