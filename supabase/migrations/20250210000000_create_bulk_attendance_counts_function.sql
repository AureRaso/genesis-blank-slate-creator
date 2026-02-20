-- Calculate attendance counts per student:
--
-- Handles two class models:
-- 1. Single-date classes (start_date = end_date): each class_participant = 1 session
--    - attended: trainer confirmed attendance (attendance_confirmed_for_date IS NOT NULL)
--    - no_show: student confirmed absence (absence_confirmed = true)
--    This avoids retroactive enrollment issues since only trainer-confirmed attendance counts.
--
-- 2. Recurring classes (start_date != end_date): generate_series with days_of_week
--    - attended = total_past_sessions - cancelled_sessions - absences
--    - no_show = absence_confirmed

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
      -- Attended count per class_participant
      CASE
        WHEN pc.start_date = pc.end_date THEN
          -- Single-date class: attended if trainer confirmed attendance for a past date
          CASE WHEN cp.attendance_confirmed_for_date IS NOT NULL
                AND pc.start_date < CURRENT_DATE
               THEN 1 ELSE 0 END
        ELSE
          -- Recurring class: schedule-based = total_sessions - cancelled - absences
          GREATEST(
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
            -
            (
              SELECT COUNT(*)
              FROM cancelled_classes cc
              WHERE cc.programmed_class_id = cp.class_id
                AND cc.cancelled_date >= GREATEST(pc.start_date, cp.created_at::date)
                AND cc.cancelled_date < CURRENT_DATE
            )
            -
            CASE WHEN cp.absence_confirmed = true THEN 1 ELSE 0 END,
            0
          )
      END::BIGINT as attended_for_class,
      -- No-show count per class_participant
      CASE
        WHEN pc.start_date = pc.end_date THEN
          -- Single-date class: no-show if absence confirmed and class date is past
          CASE WHEN cp.absence_confirmed = true AND pc.start_date < CURRENT_DATE
               THEN 1 ELSE 0 END
        ELSE
          -- Recurring class: absence confirmed
          CASE WHEN cp.absence_confirmed = true THEN 1 ELSE 0 END
      END::BIGINT as no_show_for_class
    FROM class_participants cp
    JOIN programmed_classes pc ON cp.class_id = pc.id
    WHERE cp.student_enrollment_id = ANY(p_student_enrollment_ids)
      AND cp.is_substitute IS NOT TRUE
  )
  SELECT
    ps.student_enrollment_id,
    SUM(ps.attended_for_class)::BIGINT as attended_count,
    SUM(ps.no_show_for_class)::BIGINT as no_show_count
  FROM participant_stats ps
  GROUP BY ps.student_enrollment_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_bulk_attendance_counts(UUID[]) TO authenticated;

COMMENT ON FUNCTION get_bulk_attendance_counts IS 'Calculates attended and absence counts per student. Single-date classes: uses trainer-confirmed attendance (attendance_confirmed_for_date). Recurring: schedule-based with generate_series. No-show from class_participants.absence_confirmed. Uses SECURITY DEFINER to bypass RLS.';