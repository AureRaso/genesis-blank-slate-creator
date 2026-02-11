-- Calculate attendance counts per student by deriving from:
-- attended = total_past_scheduled_sessions - cancelled_sessions - recorded_absences
-- no_show = recorded absences from class_attendance_confirmations
--
-- This approach works because the system auto-confirms attendance for all students.
-- Only absences are explicitly recorded. So "attended" = sessions that happened minus known absences.

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
  WITH participant_stats AS (
    SELECT
      cp.student_enrollment_id,
      cp.id as participant_id,
      cp.class_id,
      -- Total past scheduled sessions (generated from class schedule)
      (
        SELECT COUNT(*)
        FROM generate_series(
          GREATEST(pc.start_date, cp.created_at::date)::timestamp,
          (LEAST(COALESCE(pc.end_date, CURRENT_DATE - 1), CURRENT_DATE - 1))::timestamp,
          interval '1 day'
        ) AS d(d)
        WHERE (
          (EXTRACT(DOW FROM d.d) = 1 AND 'lunes' = ANY(pc.days_of_week)) OR
          (EXTRACT(DOW FROM d.d) = 2 AND 'martes' = ANY(pc.days_of_week)) OR
          (EXTRACT(DOW FROM d.d) = 3 AND ('miércoles' = ANY(pc.days_of_week) OR 'miercoles' = ANY(pc.days_of_week))) OR
          (EXTRACT(DOW FROM d.d) = 4 AND 'jueves' = ANY(pc.days_of_week)) OR
          (EXTRACT(DOW FROM d.d) = 5 AND 'viernes' = ANY(pc.days_of_week)) OR
          (EXTRACT(DOW FROM d.d) = 6 AND ('sábado' = ANY(pc.days_of_week) OR 'sabado' = ANY(pc.days_of_week))) OR
          (EXTRACT(DOW FROM d.d) = 0 AND 'domingo' = ANY(pc.days_of_week))
        )
      ) as total_sessions,
      -- Cancelled sessions for this class in the relevant date range
      (
        SELECT COUNT(*)
        FROM cancelled_classes cc
        WHERE cc.programmed_class_id = cp.class_id
          AND cc.cancelled_date >= GREATEST(pc.start_date, cp.created_at::date)
          AND cc.cancelled_date < CURRENT_DATE
      ) as cancelled_sessions,
      -- Recorded absences for this participant
      (
        SELECT COUNT(*)
        FROM class_attendance_confirmations cac
        WHERE cac.class_participant_id = cp.id
          AND cac.absence_confirmed = true
          AND cac.scheduled_date < CURRENT_DATE
      ) as absence_count
    FROM class_participants cp
    JOIN programmed_classes pc ON cp.class_id = pc.id
    WHERE cp.student_enrollment_id = ANY(p_student_enrollment_ids)
      AND cp.is_substitute IS NOT TRUE
  )
  SELECT
    ps.student_enrollment_id,
    GREATEST(SUM(ps.total_sessions - ps.cancelled_sessions - ps.absence_count), 0)::BIGINT as attended_count,
    SUM(ps.absence_count)::BIGINT as no_show_count
  FROM participant_stats ps
  GROUP BY ps.student_enrollment_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_bulk_attendance_counts(UUID[]) TO authenticated;

COMMENT ON FUNCTION get_bulk_attendance_counts IS 'Calculates attended and absence counts per student. Attended = scheduled sessions - cancelled - absences. Uses SECURITY DEFINER to bypass RLS.';