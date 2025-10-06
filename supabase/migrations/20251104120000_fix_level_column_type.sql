-- Fix level column type from integer to numeric to support decimals
-- Change level column from int4 to NUMERIC(3,1) to support values like 3.5

-- First, drop the existing check constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_level_check;

-- Change the column type from integer to numeric(3,1)
ALTER TABLE profiles ALTER COLUMN level TYPE NUMERIC(3,1) USING level::numeric;

-- Add back the check constraint for values between 1.0 and 10.0
ALTER TABLE profiles ADD CONSTRAINT profiles_level_check
  CHECK (level IS NULL OR (level >= 1.0 AND level <= 10.0));

-- Add comment to document the column
COMMENT ON COLUMN profiles.level IS 'User Playtomic level (1.0 - 10.0), supports decimal values like 3.5';
