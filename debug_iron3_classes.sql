-- Debug script for iron3@gmail.com classes

-- 1. Get trainer profile info
SELECT
  id,
  email,
  full_name,
  role,
  club_id
FROM profiles
WHERE email = 'iron3@gmail.com';

-- 2. Get today's day name
SELECT
  to_char(CURRENT_DATE, 'Day') as today_name_postgres,
  CASE EXTRACT(DOW FROM CURRENT_DATE)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'lunes'
    WHEN 2 THEN 'martes'
    WHEN 3 THEN 'miercoles'
    WHEN 4 THEN 'jueves'
    WHEN 5 THEN 'viernes'
    WHEN 6 THEN 'sabado'
  END as today_name_spanish;

-- 3. Get all programmed classes for this trainer
SELECT
  pc.id,
  pc.name,
  pc.start_time,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  pc.is_active,
  pc.club_id,
  pc.created_by,
  pc.trainer_profile_id,
  CURRENT_DATE as today,
  CURRENT_DATE >= pc.start_date as after_start,
  CURRENT_DATE <= pc.end_date as before_end
FROM programmed_classes pc
JOIN profiles p ON p.id = pc.trainer_profile_id OR p.id = pc.created_by
WHERE p.email = 'iron3@gmail.com'
ORDER BY pc.start_time;

-- 4. Check which classes match today's criteria
WITH today_info AS (
  SELECT
    CURRENT_DATE::text as today,
    CASE EXTRACT(DOW FROM CURRENT_DATE)
      WHEN 0 THEN 'domingo'
      WHEN 1 THEN 'lunes'
      WHEN 2 THEN 'martes'
      WHEN 3 THEN 'miercoles'
      WHEN 4 THEN 'jueves'
      WHEN 5 THEN 'viernes'
      WHEN 6 THEN 'sabado'
    END as today_day_name
)
SELECT
  pc.id,
  pc.name,
  pc.start_time,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  pc.is_active,
  pc.trainer_profile_id,
  pc.created_by,
  ti.today,
  ti.today_day_name,
  pc.days_of_week @> ARRAY[ti.today_day_name]::text[] as has_today,
  ti.today >= pc.start_date::text as after_start,
  ti.today <= pc.end_date::text as before_end,
  CASE
    WHEN pc.is_active = false THEN 'Not active'
    WHEN NOT (pc.days_of_week @> ARRAY[ti.today_day_name]::text[]) THEN 'Not scheduled for today'
    WHEN ti.today < pc.start_date::text THEN 'Start date in future'
    WHEN ti.today > pc.end_date::text THEN 'End date in past'
    ELSE 'SHOULD SHOW'
  END as status
FROM programmed_classes pc
JOIN profiles p ON p.id = pc.trainer_profile_id OR p.id = pc.created_by
CROSS JOIN today_info ti
WHERE p.email = 'iron3@gmail.com'
ORDER BY pc.start_time;

-- 5. Check participants for these classes
SELECT
  pc.name as class_name,
  pc.start_time,
  cp.id as participant_id,
  se.full_name as student_name,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed
FROM programmed_classes pc
JOIN profiles p ON p.id = pc.trainer_profile_id OR p.id = pc.created_by
LEFT JOIN class_participants cp ON cp.class_id = pc.id AND cp.status = 'active'
LEFT JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE p.email = 'iron3@gmail.com'
ORDER BY pc.start_time, se.full_name;
