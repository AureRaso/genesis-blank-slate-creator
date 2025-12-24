-- =============================================
-- Enable RLS for class_enrollment_requests table
-- Security fix: CVE reported by Supabase linter
-- =============================================

-- Enable Row Level Security
ALTER TABLE public.class_enrollment_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- 1. Students can view their own enrollment requests
CREATE POLICY "Students can view own enrollment requests"
  ON public.class_enrollment_requests
  FOR SELECT
  TO authenticated
  USING (student_profile_id = auth.uid());

-- 2. Students can create their own enrollment requests
CREATE POLICY "Students can create own enrollment requests"
  ON public.class_enrollment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (student_profile_id = auth.uid());

-- 3. Students can cancel (update status) their own pending requests
CREATE POLICY "Students can update own enrollment requests"
  ON public.class_enrollment_requests
  FOR UPDATE
  TO authenticated
  USING (student_profile_id = auth.uid());

-- 4. Trainers can view enrollment requests for their classes
CREATE POLICY "Trainers can view class enrollment requests"
  ON public.class_enrollment_requests
  FOR SELECT
  TO authenticated
  USING (
    programmed_class_id IN (
      SELECT pc.id
      FROM programmed_classes pc
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

-- 5. Trainers can manage (accept/reject) enrollment requests for their classes
CREATE POLICY "Trainers can manage class enrollment requests"
  ON public.class_enrollment_requests
  FOR UPDATE
  TO authenticated
  USING (
    programmed_class_id IN (
      SELECT pc.id
      FROM programmed_classes pc
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

-- 6. Club admins can view all enrollment requests for their club's classes
CREATE POLICY "Club admins can view club enrollment requests"
  ON public.class_enrollment_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_enrollment_requests.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- 7. Club admins can manage all enrollment requests for their club
CREATE POLICY "Club admins can manage club enrollment requests"
  ON public.class_enrollment_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_enrollment_requests.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_enrollment_requests.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- Add comment explaining RLS
COMMENT ON TABLE public.class_enrollment_requests IS 'Student requests to enroll in classes. RLS enabled: students see/create own, trainers see their classes, admins see club requests.';
