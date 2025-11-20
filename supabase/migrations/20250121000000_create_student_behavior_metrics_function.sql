-- Create function to calculate student behavior metrics for waitlist evaluation
-- This function helps trainers make informed decisions when accepting students from waitlist

CREATE OR REPLACE FUNCTION get_student_behavior_metrics(
  p_student_enrollment_id UUID,
  p_class_id UUID
)
RETURNS TABLE (
  total_attended BIGINT,
  late_notice_absences BIGINT,
  early_notice_absences BIGINT,
  total_absences BIGINT,
  club_cancelled_classes BIGINT
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH cancelled_count AS (
    SELECT COUNT(*)::BIGINT as count
    FROM cancelled_classes
    WHERE programmed_class_id = p_class_id
  )
  SELECT
    -- Total classes attended (confirmed attendance)
    COUNT(*) FILTER (
      WHERE cp.attendance_confirmed_for_date IS NOT NULL
    ) as total_attended,

    -- Absences with late notice (<5 hours before class)
    -- Since we don't have a specific class date stored with absences,
    -- we'll return 0 for now (this metric requires date tracking)
    0::BIGINT as late_notice_absences,

    -- Absences with early notice (>=5 hours before class)
    -- Since we don't have a specific class date stored with absences,
    -- we'll return 0 for now (this metric requires date tracking)
    0::BIGINT as early_notice_absences,

    -- Total absences (all absences regardless of notice time)
    COUNT(*) FILTER (
      WHERE cp.absence_confirmed = true
    ) as total_absences,

    -- Classes cancelled by the club (count from cancelled_classes table)
    COALESCE((SELECT count FROM cancelled_count), 0) as club_cancelled_classes

  FROM class_participants cp
  CROSS JOIN cancelled_count
  WHERE cp.student_enrollment_id = p_student_enrollment_id
    AND cp.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_student_behavior_metrics(UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_student_behavior_metrics IS 'Calculates student behavior metrics including attendance history, total absences, and club cancellations. Used for waitlist prioritization.';
