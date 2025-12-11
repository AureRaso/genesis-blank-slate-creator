-- Migration: Add secondary trainer support to programmed_classes
-- This allows classes to have up to 2 trainers (for classes with 8+ students)

-- Add the secondary trainer column
ALTER TABLE programmed_classes
ADD COLUMN IF NOT EXISTS trainer_profile_id_2 UUID REFERENCES profiles(id);

-- Add an index for better query performance when filtering by secondary trainer
CREATE INDEX IF NOT EXISTS idx_programmed_classes_trainer_2
ON programmed_classes(trainer_profile_id_2)
WHERE trainer_profile_id_2 IS NOT NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN programmed_classes.trainer_profile_id_2 IS
'Optional secondary trainer for classes with 8+ students. Both trainers can manage attendance.';
