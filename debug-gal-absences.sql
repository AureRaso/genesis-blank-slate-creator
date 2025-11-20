-- Debug query to see gal's absences and calculate if they were late notices
-- This will help us understand how to calculate late/early notices

-- Get gal's absences with class schedule information
SELECT
  cp.id,
  cp.absence_confirmed_at,
  cp.absence_reason,
  se.email,
  se.full_name,
  pc.name as class_name,
  pc.days_of_week,
  pc.start_time,
  -- For debugging: show the raw timestamps
  cp.absence_confirmed_at::timestamp as absence_time,
  -- We need to figure out what date the absence was for
  -- This is the missing piece - we don't know which specific occurrence
  cp.attendance_confirmed_for_date
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.email = 'gal@vmi.com'
  AND cp.absence_confirmed = true
ORDER BY cp.absence_confirmed_at DESC;

-- Check all of gal's records to understand the data
SELECT
  cp.id,
  cp.student_enrollment_id,
  cp.class_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.absence_confirmed_at,
  cp.absence_reason,
  se.email,
  pc.name as class_name,
  pc.days_of_week,
  pc.start_time
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.email = 'gal@vmi.com'
ORDER BY
  CASE
    WHEN cp.attendance_confirmed_for_date IS NOT NULL THEN cp.attendance_confirmed_for_date
    WHEN cp.absence_confirmed_at IS NOT NULL THEN cp.absence_confirmed_at::date
    ELSE CURRENT_DATE
  END DESC;
