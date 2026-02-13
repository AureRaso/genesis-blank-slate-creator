-- Update function to calculate late/early absence notices
-- Uses heuristic: absence was for next occurrence of class after absence_confirmed_at

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
    -- Count cancelled classes for this student, only counting cancellations
    -- that happened on or after the student was enrolled in that class
    SELECT COALESCE(COUNT(*)::BIGINT, 0) as count
    FROM cancelled_classes cc
    WHERE
      CASE
        -- If placeholder ID (all zeros), count all cancelled classes for student's classes
        WHEN p_class_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
          EXISTS (
            SELECT 1
            FROM class_participants cp2
            WHERE cp2.student_enrollment_id = p_student_enrollment_id
              AND cp2.class_id = cc.programmed_class_id
              AND cc.cancelled_date >= cp2.created_at::date
          )
        -- Otherwise, filter by specific class
        ELSE cc.programmed_class_id = p_class_id
      END
  ),
  absences_with_notice_time AS (
    SELECT
      cp.id,
      cp.absence_confirmed_at,
      pc.days_of_week,
      pc.start_time,
      -- Calculate next class occurrence after absence was confirmed
      -- This finds the next occurrence of any day in days_of_week array
      CASE
        WHEN pc.days_of_week IS NOT NULL AND array_length(pc.days_of_week, 1) > 0 THEN
          -- Get the day of week when absence was confirmed (0=Sunday, 6=Saturday)
          -- Then find next occurrence of class day
          cp.absence_confirmed_at::date +
          ((
            -- Find the minimum days until next class occurrence
            SELECT MIN(
              CASE
                -- Map Spanish day names to numbers and calculate days until next occurrence
                WHEN unnest = 'domingo' THEN (0 - EXTRACT(DOW FROM cp.absence_confirmed_at)::int + 7) % 7
                WHEN unnest = 'lunes' THEN (1 - EXTRACT(DOW FROM cp.absence_confirmed_at)::int + 7) % 7
                WHEN unnest = 'martes' THEN (2 - EXTRACT(DOW FROM cp.absence_confirmed_at)::int + 7) % 7
                WHEN unnest IN ('miercoles', 'miércoles') THEN (3 - EXTRACT(DOW FROM cp.absence_confirmed_at)::int + 7) % 7
                WHEN unnest = 'jueves' THEN (4 - EXTRACT(DOW FROM cp.absence_confirmed_at)::int + 7) % 7
                WHEN unnest = 'viernes' THEN (5 - EXTRACT(DOW FROM cp.absence_confirmed_at)::int + 7) % 7
                WHEN unnest IN ('sabado', 'sábado') THEN (6 - EXTRACT(DOW FROM cp.absence_confirmed_at)::int + 7) % 7
              END
            )
            FROM unnest(pc.days_of_week)
          ) || ' days')::interval
        ELSE
          NULL
      END as next_class_date
    FROM class_participants cp
    JOIN programmed_classes pc ON cp.class_id = pc.id
    WHERE cp.student_enrollment_id = p_student_enrollment_id
      AND cp.absence_confirmed = true
      AND cp.status = 'active'
  ),
  absences_classified AS (
    SELECT
      id,
      -- Calculate hours between absence confirmation and next class
      EXTRACT(EPOCH FROM (
        (next_class_date + start_time::time) - absence_confirmed_at
      )) / 3600 as hours_notice
    FROM absences_with_notice_time
    WHERE next_class_date IS NOT NULL
  ),
  attendance_and_absence_counts AS (
    SELECT
      -- Count all attendance confirmations for past/today (regardless of absences)
      COUNT(*) FILTER (
        WHERE cp.attendance_confirmed_for_date IS NOT NULL
          AND cp.attendance_confirmed_for_date <= CURRENT_DATE
      ) as total_attendance_confirmations,

      -- Count late notice absences
      COALESCE(
        (SELECT COUNT(*)::BIGINT
         FROM absences_classified
         WHERE hours_notice < 5 AND hours_notice >= 0),
        0
      ) as late_absences,

      -- Count early notice absences
      COALESCE(
        (SELECT COUNT(*)::BIGINT
         FROM absences_classified
         WHERE hours_notice >= 5),
        0
      ) as early_absences,

      -- Total absences (all absences regardless of notice time)
      COUNT(*) FILTER (
        WHERE cp.absence_confirmed = true
      ) as total_absences_count

    FROM class_participants cp
    WHERE cp.student_enrollment_id = p_student_enrollment_id
      AND cp.status = 'active'
  )
  SELECT
    -- Actual attendance = confirmed attendances - (late absences + early absences)
    GREATEST(
      aac.total_attendance_confirmations - (aac.late_absences + aac.early_absences),
      0
    ) as total_attended,

    -- Absences with late notice (<5 hours before class)
    aac.late_absences as late_notice_absences,

    -- Absences with early notice (>=5 hours before class)
    aac.early_absences as early_notice_absences,

    -- Total absences (all absences regardless of notice time)
    aac.total_absences_count as total_absences,

    -- Classes cancelled by the club (count from cancelled_classes table)
    COALESCE((SELECT count FROM cancelled_count), 0) as club_cancelled_classes

  FROM attendance_and_absence_counts aac
  CROSS JOIN cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_student_behavior_metrics(UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_student_behavior_metrics IS 'Calculates student behavior metrics including attendance history, late/early absence notices, and club cancellations. Late/early notices are calculated heuristically by finding the next class occurrence after absence was confirmed.';
