-- Verify gal@vmi.com attendance count is correct
-- This compares the function result with a direct count

-- 1. Get the function result
SELECT * FROM get_student_behavior_metrics(
  '99206cc1-e7e4-4b02-b9c4-a0fddf724a04'::UUID,  -- gal's student_enrollment_id
  '69478f21-6a1b-495f-b2b0-7e4fe60d41aa'::UUID   -- any class_id (doesn't matter since we removed the filter)
);

-- 2. Count manually from class_participants
SELECT
  se.email,
  se.full_name,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL) as total_attended_count,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL AND cp.attendance_confirmed_for_date <= CURRENT_DATE) as attended_until_today,
  COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as total_absences_count,
  COUNT(*) as total_records
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active'
GROUP BY se.email, se.full_name;

-- 3. List all attended classes with dates to verify
SELECT
  se.email,
  se.full_name,
  pc.name as class_name,
  cp.attendance_confirmed_for_date,
  CASE
    WHEN cp.attendance_confirmed_for_date <= CURRENT_DATE THEN 'PASADO/HOY'
    ELSE 'FUTURO'
  END as timing
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active'
  AND cp.attendance_confirmed_for_date IS NOT NULL
ORDER BY cp.attendance_confirmed_for_date DESC;

-- 4. Show today's date for reference
SELECT CURRENT_DATE as today, NOW() as now;
