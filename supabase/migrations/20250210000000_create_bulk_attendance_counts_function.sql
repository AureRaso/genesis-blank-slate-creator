-- Create SECURITY DEFINER function to get attendance counts from class_attendance_confirmations
-- This bypasses RLS so superadmins can see all data
-- Returns attended and absence counts per student enrollment
--
-- Uses class_attendance_confirmations (the active table) instead of class_attendance_records (skipped migrations)
-- attendance_confirmed = true means the student confirmed/was marked as attending
-- absence_confirmed = true means the student confirmed/was marked as absent

CREATE OR REPLACE FUNCTION get_bulk_attendance_counts(
  p_student_enrollment_ids UUID[]
)
RETURNS TABLE (
  student_enrollment_id UUID,
  attended_count BIGINT,
  no_show_count BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.student_enrollment_id,
    COUNT(*) FILTER (
      WHERE cac.attendance_confirmed = true
    ) as attended_count,
    COUNT(*) FILTER (
      WHERE cac.absence_confirmed = true
    ) as no_show_count
  FROM class_attendance_confirmations cac
  JOIN class_participants cp ON cp.id = cac.class_participant_id
  WHERE cp.student_enrollment_id = ANY(p_student_enrollment_ids)
  GROUP BY cp.student_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_bulk_attendance_counts(UUID[]) TO authenticated;

COMMENT ON FUNCTION get_bulk_attendance_counts IS 'Returns attended and absence counts from class_attendance_confirmations for multiple students. Uses SECURITY DEFINER to bypass RLS.';
