-- Fix is_open default value to be false instead of true
-- Classes should be closed by default, only open when explicitly selected

-- Change the default value for existing column
ALTER TABLE programmed_classes
ALTER COLUMN is_open SET DEFAULT false;

-- Update existing classes that were created with is_open = true by default
-- This will set them to false unless they were explicitly marked as open
-- IMPORTANT: Review this before running - you may want to keep some classes as open
-- UPDATE programmed_classes SET is_open = false WHERE is_open = true;

-- Add comment to clarify the expected behavior
COMMENT ON COLUMN programmed_classes.is_open IS 'Controls if the class is visible in "Clases Disponibles" for players to book. Default is false (closed class).';
