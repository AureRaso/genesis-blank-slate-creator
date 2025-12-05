-- Debug the late notice calculation for gal@vmi.com's absences
-- This shows step-by-step how the function calculates late/early notices

WITH absences_with_notice_time AS (
  SELECT
    cp.id,
    pc.name as class_name,
    cp.absence_confirmed_at,
    pc.days_of_week,
    pc.start_time,
    -- Calculate next class occurrence after absence was confirmed
    CASE
      WHEN pc.days_of_week IS NOT NULL AND array_length(pc.days_of_week, 1) > 0 THEN
        cp.absence_confirmed_at::date +
        ((
          SELECT MIN(
            CASE
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
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  JOIN programmed_classes pc ON cp.class_id = pc.id
  WHERE se.email = 'gal@vmi.com'
    AND cp.absence_confirmed = true
    AND cp.status = 'active'
)
SELECT
  id,
  class_name,
  absence_confirmed_at,
  days_of_week,
  start_time,
  next_class_date,
  (next_class_date + start_time::time) as next_class_datetime,
  -- Calculate hours between absence confirmation and next class
  ROUND(
    (EXTRACT(EPOCH FROM (
      (next_class_date + start_time::time) - absence_confirmed_at
    )) / 3600)::numeric,
    2
  ) as hours_notice,
  CASE
    WHEN EXTRACT(EPOCH FROM (
      (next_class_date + start_time::time) - absence_confirmed_at
    )) / 3600 < 5 AND EXTRACT(EPOCH FROM (
      (next_class_date + start_time::time) - absence_confirmed_at
    )) / 3600 >= 0
    THEN 'LATE (<5h)'
    WHEN EXTRACT(EPOCH FROM (
      (next_class_date + start_time::time) - absence_confirmed_at
    )) / 3600 >= 5
    THEN 'EARLY (>=5h)'
    ELSE 'INVALID'
  END as notice_type
FROM absences_with_notice_time
WHERE next_class_date IS NOT NULL
ORDER BY absence_confirmed_at DESC;
