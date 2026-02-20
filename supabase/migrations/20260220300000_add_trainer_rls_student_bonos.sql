-- ============================================================================
-- FIX: Allow trainers to read student_bonos and bono_templates
-- ============================================================================
-- The original RLS policies only allow admin/superadmin/student/guardian to
-- SELECT from student_bonos and bono_templates. Trainers need read access
-- to show bono info on attendance cards (TodayAttendance/WeekAttendance).
-- ============================================================================

-- Trainers can view student bonos in their club
CREATE POLICY "Trainers can view student bonos in their club"
  ON student_bonos FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role = 'trainer'
    )
  );

-- Trainers can view bono templates in their club (needed for JOIN in queries)
CREATE POLICY "Trainers can view bono templates in their club"
  ON bono_templates FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role = 'trainer'
    )
  );
