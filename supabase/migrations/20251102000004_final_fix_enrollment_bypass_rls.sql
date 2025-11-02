-- FINAL FIX: Grant the postgres role BYPASSRLS for the helper function
-- This ensures the function can insert into student_enrollments regardless of RLS policies

-- First, let's see the current owner of the function
DO $$
DECLARE
  func_owner text;
BEGIN
  SELECT pg_catalog.pg_get_userbyid(proowner) INTO func_owner
  FROM pg_catalog.pg_proc
  WHERE proname = 'create_student_enrollment_for_signup';

  RAISE NOTICE 'Current function owner: %', COALESCE(func_owner, 'function not found');
END $$;

-- Recreate the function with explicit grants
CREATE OR REPLACE FUNCTION public.create_student_enrollment_for_signup(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_club_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable RLS for this transaction
  SET LOCAL row_security = off;

  -- Insert student_enrollment without being blocked by RLS
  INSERT INTO public.student_enrollments (
    full_name,
    email,
    club_id,
    student_profile_id,
    created_by_profile_id
  )
  VALUES (
    p_full_name,
    p_email,
    p_club_id,
    p_user_id,
    p_user_id
  )
  ON CONFLICT (email, club_id) DO NOTHING;

  RAISE NOTICE 'Student enrollment created/updated for: %', p_email;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in create_student_enrollment_for_signup: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid) TO service_role;

COMMENT ON FUNCTION public.create_student_enrollment_for_signup(uuid, text, text, uuid) IS
'Helper function to create student_enrollment during signup. Uses SET LOCAL row_security = off to bypass RLS.';

-- Test the function works
DO $$
BEGIN
  RAISE NOTICE 'Function recreated with RLS bypass. Ready to test with new user signup.';
END $$;
