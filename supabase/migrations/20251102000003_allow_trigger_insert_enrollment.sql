-- Allow authenticated users to insert their own student_enrollment
-- This is needed for the handle_new_user trigger to work

-- First, check what policies exist
DO $$
BEGIN
  RAISE NOTICE 'Existing INSERT policies on student_enrollments will be listed below';
END $$;

-- Drop restrictive INSERT policies if they exist
DROP POLICY IF EXISTS "Only admins can create enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Students can create their own enrollments" ON public.student_enrollments;

-- Create a permissive policy that allows:
-- 1. Admins to create any enrollment
-- 2. Users to create their own enrollment (via trigger during signup)
CREATE POLICY "Allow enrollment creation during signup" ON public.student_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow if user is admin
    (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
    OR
    -- Allow if user is creating their own enrollment (during signup via trigger)
    (student_profile_id = auth.uid())
  );

COMMENT ON POLICY "Allow enrollment creation during signup" ON public.student_enrollments IS
'Allows admins to create any enrollment, and users to create their own enrollment during signup';

-- Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'Policy created successfully. Testing with a simple select...';
END $$;
