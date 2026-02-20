-- Calculate attendance counts per student by deriving from:
-- attended = total_past_sessions - cancelled_sessions - absences
-- no_show = absences from class_participants.absence_confirmed
--
-- Handles two class models:
-- 1. Single-date classes (start_date = end_date): each class_participant = 1 session
-- 2. Recurring classes (start_date != end_date): generate_series with days_of_week
--
-- Absences are read from class_participants.absence_confirmed (not class_attendance_confirmations)
-- because student self-service absence only writes to class_participants.

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
      -- Total past scheduled sessions
      CASE
        WHEN pc.start_date = pc.end_date THEN
          -- Single-date class: 1 session if date is in the past
          CASE WHEN pc.start_date < CURRENT_DATE THEN 1 ELSE 0 END
        ELSE
          -- Recurring class: count matching days of week in date range
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
          )
      END::BIGINT as total_sessions,
      -- Cancelled sessions for this class
      (
        SELECT COUNT(*)
        FROM cancelled_classes cc
        WHERE cc.programmed_class_id = cp.class_id
          AND cc.cancelled_date >= CASE
            WHEN pc.start_date = pc.end_date THEN pc.start_date
            ELSE GREATEST(pc.start_date, cp.created_at::date)
          END
          AND cc.cancelled_date < CURRENT_DATE
      ) as cancelled_sessions,
      -- Absence: 1 if student confirmed absence for a past class, 0 otherwise
      CASE
        WHEN cp.absence_confirmed = true AND pc.start_date < CURRENT_DATE THEN 1
        ELSE 0
      END as absence_count
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

COMMENT ON FUNCTION get_bulk_attendance_counts IS 'Calculates attended and absence counts per student. Single-date classes: 1 session if past. Recurring: generate_series. Absences from class_participants.absence_confirmed. Uses SECURITY DEFINER to bypass RLS.';