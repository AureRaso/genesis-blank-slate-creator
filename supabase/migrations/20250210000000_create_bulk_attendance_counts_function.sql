-- Create SECURITY DEFINER function to get attendance counts from class_attendance_records
-- This bypasses RLS so superadmins can see all data
-- Returns attended and no-show counts per student enrollment

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
      WHERE car.had_confirmed_attendance = true AND car.actually_attended = true
    ) as attended_count,
    COUNT(*) FILTER (
      WHERE car.had_confirmed_attendance = true AND car.actually_attended = false
    ) as no_show_count
  FROM class_attendance_records car
  JOIN class_participants cp ON cp.id = car.class_participant_id
  WHERE cp.student_enrollment_id = ANY(p_student_enrollment_ids)
  GROUP BY cp.student_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_bulk_attendance_counts(UUID[]) TO authenticated;

COMMENT ON FUNCTION get_bulk_attendance_counts IS 'Returns attended and no-show counts from class_attendance_records for multiple students. Uses SECURITY DEFINER to bypass RLS.';
