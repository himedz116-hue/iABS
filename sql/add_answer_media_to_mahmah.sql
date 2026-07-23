-- Add answer_media_url and answer_media_type columns to mahmah_questions table
-- This migration allows answers to have images, videos, or audio instead of just images

-- Add answer_media_url column (replaces answer_image_url)
ALTER TABLE mahmah_questions ADD COLUMN IF NOT EXISTS answer_media_url TEXT;

-- Add answer_media_type column to specify the type of media (image, video, audio)
ALTER TABLE mahmah_questions ADD COLUMN IF NOT EXISTS answer_media_type TEXT CHECK (answer_media_type IN ('image', 'video', 'audio'));

-- Migrate existing answer_image_url data to answer_media_url
UPDATE mahmah_questions SET answer_media_url = answer_image_url WHERE answer_image_url IS NOT NULL AND answer_media_url IS NULL;
UPDATE mahmah_questions SET answer_media_type = 'image' WHERE answer_image_url IS NOT NULL AND answer_media_type IS NULL;

-- Optional: You can drop the old answer_image_url column after verifying the migration worked
-- ALTER TABLE mahmah_questions DROP COLUMN IF EXISTS answer_image_url;
