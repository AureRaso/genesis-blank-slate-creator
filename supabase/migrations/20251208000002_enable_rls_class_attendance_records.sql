-- =============================================
-- Enable RLS for class_attendance_records table
-- Security fix: CVE reported by Supabase linter
-- =============================================

-- Enable Row Level Security
ALTER TABLE public.class_attendance_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- 1. Students can view their own attendance records
CREATE POLICY "Students can view own attendance records"
  ON public.class_attendance_records
  FOR SELECT
  TO authenticated
  USING (
    class_participant_id IN (
      SELECT cp.id
      FROM class_participants cp
      JOIN student_enrollments se ON se.id = cp.student_enrollment_id
      WHERE se.student_profile_id = auth.uid()
         OR se.email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- 2. Trainers can view attendance records for their classes
CREATE POLICY "Trainers can view class attendance records"
  ON public.class_attendance_records
  FOR SELECT
  TO authenticated
  USING (
    programmed_class_id IN (
      SELECT pc.id
      FROM programmed_classes pc
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

-- 3. Trainers can create and update attendance records for their classes
CREATE POLICY "Trainers can manage class attendance records"
  ON public.class_attendance_records
  FOR ALL
  TO authenticated
  USING (
    programmed_class_id IN (
      SELECT pc.id
      FROM programmed_classes pc
      WHERE pc.trainer_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    programmed_class_id IN (
      SELECT pc.id
      FROM programmed_classes pc
      WHERE pc.trainer_profile_id = auth.uid()
    )
  );

-- 4. Club admins can view all attendance records for their club
CREATE POLICY "Club admins can view club attendance records"
  ON public.class_attendance_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_attendance_records.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- 5. Club admins can manage all attendance records for their club
CREATE POLICY "Club admins can manage club attendance records"
  ON public.class_attendance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_attendance_records.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM programmed_classes pc
      JOIN profiles p ON p.id = auth.uid()
      WHERE pc.id = class_attendance_records.programmed_class_id
        AND pc.club_id = p.club_id
        AND p.role IN ('owner', 'admin')
    )
  );

-- Add comment explaining RLS
COMMENT ON TABLE public.class_attendance_records IS 'Historical attendance records per class date. RLS enabled: students see own, trainers see their classes, admins see club records.';
