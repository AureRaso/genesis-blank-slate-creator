-- Add max_participants field to programmed_classes
-- This defines the maximum number of students allowed in each class

ALTER TABLE programmed_classes
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 8 CHECK (max_participants > 0);

COMMENT ON COLUMN programmed_classes.max_participants
IS 'Maximum number of participants allowed in this class. Default is 8.';

-- Update existing classes to have a default value
UPDATE programmed_classes
SET max_participants = 8
WHERE max_participants IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE programmed_classes
ALTER COLUMN max_participants SET NOT NULL;
