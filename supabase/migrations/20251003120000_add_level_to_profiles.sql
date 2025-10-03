-- Add level column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level NUMERIC(3,1);

-- Add a comment to document the column
COMMENT ON COLUMN profiles.level IS 'User Playtomic level (1.0 - 10.0)';

-- Add a check constraint to ensure level is between 1.0 and 10.0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_level_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_level_check
    CHECK (level IS NULL OR (level >= 1.0 AND level <= 10.0));
  END IF;
END $$;
