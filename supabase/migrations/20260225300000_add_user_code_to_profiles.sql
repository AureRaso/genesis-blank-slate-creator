-- ============================================================================
-- Migration: Add user_code to profiles
-- Unique 6-character alphanumeric code for each user
-- ============================================================================

-- 1. Add column (nullable initially for backfill)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_code VARCHAR(6);

-- 2. Function to generate unique user codes
-- Charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (30 chars, no 0/O/1/I/L)
CREATE OR REPLACE FUNCTION generate_unique_user_code()
RETURNS VARCHAR(6)
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(6);
  i INT;
  attempts INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * 30 + 1)::int, 1);
    END LOOP;

    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_code = result) THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique user_code after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- 3. Backfill all existing profiles
UPDATE profiles SET user_code = generate_unique_user_code() WHERE user_code IS NULL;

-- 4. Add constraints after backfill
ALTER TABLE profiles ALTER COLUMN user_code SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN user_code SET DEFAULT '';
-- The BEFORE INSERT trigger always replaces '' or NULL with a generated code,
-- so the DEFAULT '' is just a safety net for the NOT NULL constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_code_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_code_unique UNIQUE (user_code);
  END IF;
END;
$$;

-- 5. Trigger: auto-generate user_code for new profiles
CREATE OR REPLACE FUNCTION set_user_code_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_code IS NULL OR NEW.user_code = '' THEN
    NEW.user_code := generate_unique_user_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_user_code ON profiles;
CREATE TRIGGER trg_set_user_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_user_code_on_insert();

-- 6. RPC: lookup user by code, scoped to the same club
-- Checks both profiles.club_id and student_enrollments.club_id
CREATE OR REPLACE FUNCTION lookup_user_by_code(p_code TEXT, p_club_id UUID DEFAULT NULL)
RETURNS TABLE(id UUID, full_name TEXT, email TEXT, user_code VARCHAR)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.user_code
  FROM profiles p
  WHERE p.user_code = upper(trim(p_code))
    AND (
      p_club_id IS NULL
      OR p.club_id = p_club_id
      OR EXISTS (
        SELECT 1 FROM student_enrollments se
        WHERE se.email = p.email
          AND se.club_id = p_club_id
          AND se.status = 'activo'
      )
    )
  LIMIT 1;
END;
$$;
