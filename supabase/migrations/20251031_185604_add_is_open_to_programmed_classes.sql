-- Add is_open field to programmed_classes table
-- This field controls whether a class appears in "Clases Disponibles" for players

ALTER TABLE programmed_classes
ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN programmed_classes.is_open IS 'Controls if the class is visible in "Clases Disponibles" for players to book';

-- Create index for better performance when filtering open classes
CREATE INDEX IF NOT EXISTS idx_programmed_classes_is_open ON programmed_classes(is_open) WHERE is_open = true AND is_active = true;
