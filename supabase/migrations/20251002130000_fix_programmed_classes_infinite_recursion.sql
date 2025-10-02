-- Fix infinite recursion in programmed_classes RLS policies
-- The issue: programmed_classes policy checks enrollment_tokens, which checks programmed_classes again

-- Drop the problematic policy
DROP POLICY IF EXISTS "Allow public read of classes with valid enrollment token" ON public.programmed_classes;

-- Create a security definer function to check for valid enrollment tokens
-- This breaks the recursion by executing with definer's privileges
CREATE OR REPLACE FUNCTION public.has_valid_enrollment_token(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.enrollment_tokens
    WHERE enrollment_tokens.class_id = p_class_id
      AND enrollment_tokens.is_active = true
      AND enrollment_tokens.expires_at > now()
  );
END;
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Allow public read of classes with valid enrollment token"
ON public.programmed_classes
FOR SELECT
USING (has_valid_enrollment_token(id));
