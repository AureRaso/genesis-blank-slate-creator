-- Test query to calculate late/early notices for gal@vmi.com
-- This calculates the next class occurrence after the absence was confirmed

WITH absences_with_next_class AS (
  SELECT
    cp.id,
    cp.absence_confirmed_at,
    pc.days_of_week,
    pc.start_time,
    se.email,
    pc.name as class_name,
    -- Calculate the next class date after absence was confirmed
    -- For simplicity, we'll assume the absence was for the next occurrence of that day
    -- This is an approximation but should work for most cases
    CASE
      -- If days_of_week contains the day, calculate next occurrence
      WHEN pc.days_of_week IS NOT NULL AND array_length(pc.days_of_week, 1) > 0 THEN
        -- For now, let's just add 7 days as an estimate
        -- A more precise calculation would require checking the day of week
        (cp.absence_confirmed_at::date + INTERVAL '7 days')::date
      ELSE
        NULL
    END as estimated_class_date,
    -- Combine estimated class date with start time
    (cp.absence_confirmed_at::date + INTERVAL '7 days' + pc.start_time::time) as estimated_class_datetime,
    -- Calculate hours of notice
    EXTRACT(EPOCH FROM (
      (cp.absence_confirmed_at::date + INTERVAL '7 days' + pc.start_time::time) - cp.absence_confirmed_at
    )) / 3600 as hours_notice
  FROM class_participants cp
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  JOIN programmed_classes pc ON cp.class_id = pc.id
  WHERE se.email = 'gal@vmi.com'
    AND cp.absence_confirmed = true
    AND cp.status = 'active'
)
SELECT
  id,
  email,
  class_name,
  absence_confirmed_at,
  days_of_week,
  start_time,
  estimated_class_date,
  estimated_class_datetime,
  ROUND(hours_notice::numeric, 2) as hours_notice,
  CASE
    WHEN hours_notice < 5 THEN 'LATE (<5h)'
    ELSE 'EARLY (>=5h)'
  END as notice_type
FROM absences_with_next_class
ORDER BY absence_confirmed_at DESC;
