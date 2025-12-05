-- Verify that the attendance count excludes absences
-- This should show 3 attended ONLY if those 3 don't have absence_confirmed = true

SELECT
  se.email,
  -- Count with the NEW logic (excluding absences)
  COUNT(*) FILTER (
    WHERE cp.attendance_confirmed_for_date IS NOT NULL
      AND cp.attendance_confirmed_for_date <= CURRENT_DATE
      AND cp.absence_confirmed = false
  ) as attended_excluding_absences,

  -- Count with OLD logic (not excluding absences)
  COUNT(*) FILTER (
    WHERE cp.attendance_confirmed_for_date IS NOT NULL
      AND cp.attendance_confirmed_for_date <= CURRENT_DATE
  ) as attended_including_absences,

  -- Total absences
  COUNT(*) FILTER (
    WHERE cp.absence_confirmed = true
  ) as total_absences,

  -- Show if there's overlap (attendance + absence on same record)
  COUNT(*) FILTER (
    WHERE cp.attendance_confirmed_for_date IS NOT NULL
      AND cp.absence_confirmed = true
  ) as overlap_count

FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active'
GROUP BY se.email;

-- Show the actual records to understand what's happening
SELECT
  se.email,
  pc.name as class_name,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  CASE
    WHEN cp.attendance_confirmed_for_date IS NOT NULL AND cp.attendance_confirmed_for_date <= CURRENT_DATE AND cp.absence_confirmed = false
    THEN 'COUNTED as attended'
    WHEN cp.attendance_confirmed_for_date IS NOT NULL AND cp.attendance_confirmed_for_date <= CURRENT_DATE AND cp.absence_confirmed = true
    THEN 'NOT counted (has absence)'
    WHEN cp.attendance_confirmed_for_date IS NOT NULL AND cp.attendance_confirmed_for_date > CURRENT_DATE
    THEN 'FUTURE (not counted)'
    WHEN cp.absence_confirmed = true
    THEN 'ABSENCE only'
    ELSE 'Other'
  END as status
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active'
  AND (cp.attendance_confirmed_for_date IS NOT NULL OR cp.absence_confirmed = true)
ORDER BY cp.attendance_confirmed_for_date DESC NULLS LAST;
