-- Add flag to distinguish admin-as-instructor from regular trainers
-- Regular trainers: is_private_lesson_only = false (default)
-- Admins who only give private lessons: is_private_lesson_only = true
ALTER TABLE trainers
  ADD COLUMN IF NOT EXISTS is_private_lesson_only BOOLEAN NOT NULL DEFAULT false;
