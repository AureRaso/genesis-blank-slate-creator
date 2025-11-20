-- Comprehensive verification for gal@vmi.com to understand attendance vs absences
-- This will show exactly which records count as attendance and why

-- 1. Show the current function output
SELECT 'FUNCTION OUTPUT:' as section;
SELECT * FROM get_student_behavior_metrics(
  '99206cc1-e7e4-4b02-b9c4-a0fddf724a04'::UUID,  -- gal's student_enrollment_id
  '69478f21-6a1b-495f-b2b0-7e4fe60d41aa'::UUID   -- any class_id
);

-- 2. Show detailed breakdown of each class participation record
SELECT 'DETAILED RECORDS:' as section;
SELECT
  pc.name as class_name,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.absence_confirmed_at,
  CASE
    -- This is the EXACT logic from the function
    WHEN cp.attendance_confirmed_for_date IS NOT NULL
         AND cp.attendance_confirmed_for_date <= CURRENT_DATE
         AND cp.absence_confirmed = false
    THEN '✅ COUNTED as attended'

    WHEN cp.attendance_confirmed_for_date IS NOT NULL
         AND cp.attendance_confirmed_for_date <= CURRENT_DATE
         AND cp.absence_confirmed = true
    THEN '❌ NOT counted (has absence)'

    WHEN cp.attendance_confirmed_for_date IS NOT NULL
         AND cp.attendance_confirmed_for_date > CURRENT_DATE
    THEN '⏭️ FUTURE (not counted)'

    WHEN cp.absence_confirmed = true
    THEN '🚫 ABSENCE only (no prior attendance)'

    ELSE '⚪ Other (not counted)'
  END as status,

  -- Show the exact date to understand timeline
  cp.attendance_confirmed_for_date as attended_date,
  CURRENT_DATE as today

FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active'
ORDER BY
  CASE
    WHEN cp.attendance_confirmed_for_date IS NOT NULL THEN cp.attendance_confirmed_for_date
    WHEN cp.absence_confirmed_at IS NOT NULL THEN cp.absence_confirmed_at::date
    ELSE CURRENT_DATE
  END DESC;

-- 3. Count summary using the exact same logic as the function
SELECT 'COUNT VERIFICATION:' as section;
SELECT
  COUNT(*) FILTER (
    WHERE cp.attendance_confirmed_for_date IS NOT NULL
      AND cp.attendance_confirmed_for_date <= CURRENT_DATE
      AND cp.absence_confirmed = false
  ) as total_attended_by_function_logic,

  COUNT(*) FILTER (
    WHERE cp.absence_confirmed = true
  ) as total_absences,

  -- Show records that have BOTH (should be 0 if mutually exclusive)
  COUNT(*) FILTER (
    WHERE cp.attendance_confirmed_for_date IS NOT NULL
      AND cp.absence_confirmed = true
  ) as records_with_both

FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE se.email = 'gal@vmi.com'
  AND cp.status = 'active';

-- 4. Check current date for reference
SELECT 'CURRENT DATE:' as section;
SELECT
  CURRENT_DATE as today,
  CURRENT_TIMESTAMP as now;
