-- RPC function to find ghost enrollments by phone + club.
-- Uses SECURITY DEFINER to bypass RLS so that newly registered players
-- can discover ghost enrollments that were created by admins.
-- Only returns ghost enrollments (is_ghost = true, status = active).

CREATE OR REPLACE FUNCTION public.find_ghost_enrollment(
  p_phone text,
  p_club_id uuid
)
RETURNS TABLE (
  enrollment_id uuid,
  full_name text,
  phone text,
  club_id uuid,
  club_name text,
  class_name text,
  class_start_time time,
  class_days_of_week text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    se.id AS enrollment_id,
    se.full_name,
    se.phone,
    se.club_id,
    c.name AS club_name,
    pc.name AS class_name,
    pc.start_time AS class_start_time,
    pc.days_of_week AS class_days_of_week
  FROM student_enrollments se
  LEFT JOIN clubs c ON c.id = se.club_id
  LEFT JOIN class_participants cp
    ON cp.student_enrollment_id = se.id
    AND cp.status = 'active'
  LEFT JOIN programmed_classes pc
    ON pc.id = cp.class_id
  WHERE se.phone = p_phone
    AND se.club_id = p_club_id
    AND se.is_ghost = true
    AND se.status = 'active'
  LIMIT 1;
END;
$$;

-- Also need a SECURITY DEFINER function to claim a ghost enrollment,
-- since the UPDATE policy requires student_profile_id = auth.uid()
-- but the ghost has student_profile_id = null.

CREATE OR REPLACE FUNCTION public.claim_ghost_enrollment(
  p_enrollment_id uuid,
  p_user_id uuid,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
  v_club_id uuid;
BEGIN
  -- Only claim if it's actually the authenticated user calling
  IF p_user_id != auth.uid() THEN
    RETURN false;
  END IF;

  -- Get the club_id of the ghost enrollment before claiming
  SELECT se.club_id INTO v_club_id
  FROM student_enrollments se
  WHERE se.id = p_enrollment_id
    AND se.is_ghost = true;

  IF v_club_id IS NULL THEN
    RETURN false;
  END IF;

  -- Claim the ghost enrollment
  UPDATE student_enrollments
  SET
    student_profile_id = p_user_id,
    email = COALESCE(p_email, email),
    is_ghost = false,
    ghost_matched_at = now(),
    updated_at = now()
  WHERE id = p_enrollment_id
    AND is_ghost = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    -- Delete the duplicate enrollment that was auto-created by the
    -- handle_new_user trigger for the same user + club.
    -- This avoids leaving two active enrollments for one player.
    DELETE FROM student_enrollments
    WHERE student_profile_id = p_user_id
      AND club_id = v_club_id
      AND id != p_enrollment_id
      AND status = 'active';
  END IF;

  RETURN v_updated > 0;
END;
$$;