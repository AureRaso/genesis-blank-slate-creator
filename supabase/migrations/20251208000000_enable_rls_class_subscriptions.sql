-- =============================================
-- Enable RLS for class_subscriptions table
-- Security fix: CVE reported by Supabase linter
-- =============================================

-- Enable Row Level Security
ALTER TABLE public.class_subscriptions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- 1. Students can view their own subscriptions
CREATE POLICY "Students can view own subscriptions"
  ON public.class_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    student_enrollment_id IN (
      SELECT se.id
      FROM student_enrollments se
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- 2. Club admins and owners can view all subscriptions for their club
CREATE POLICY "Club admins can view club subscriptions"
  ON public.class_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM student_enrollments se
      JOIN profiles p ON p.id = auth.uid()
      WHERE se.id = class_subscriptions.student_enrollment_id
        AND se.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- 3. Club admins can manage (insert, update, delete) subscriptions for their club
CREATE POLICY "Club admins can manage club subscriptions"
  ON public.class_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM student_enrollments se
      JOIN profiles p ON p.id = auth.uid()
      WHERE se.id = class_subscriptions.student_enrollment_id
        AND se.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM student_enrollments se
      JOIN profiles p ON p.id = auth.uid()
      WHERE se.id = class_subscriptions.student_enrollment_id
        AND se.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- 4. Service role (Edge Functions) can manage all subscriptions
-- Note: service_role bypasses RLS by default, no policy needed

-- Add comment explaining RLS
COMMENT ON TABLE public.class_subscriptions IS 'Student payment subscriptions (Stripe). RLS enabled: students see own, admins see club subscriptions.';
