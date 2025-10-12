-- 1. Get iron3 profile
SELECT
  id,
  email,
  full_name,
  role,
  club_id
FROM profiles
WHERE email = 'iron3@gmail.com';

-- 2. Get today info
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
  END as today_day_name;

-- 3. Get ALL programmed classes (by trainer_profile_id OR created_by)
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
  pc.trainer_profile_id
FROM programmed_classes pc
WHERE pc.trainer_profile_id = 'bd464755-a2ea-4759-90fb-e562b6f28884'
   OR pc.created_by = 'bd464755-a2ea-4759-90fb-e562b6f28884'
ORDER BY pc.start_time;

-- 4. Check if trainer role filter is working
SELECT
  pc.id,
  pc.name,
  pc.created_by,
  pc.trainer_profile_id,
  'bd464755-a2ea-4759-90fb-e562b6f28884' as iron3_id,
  pc.created_by = 'bd464755-a2ea-4759-90fb-e562b6f28884' as matches_created_by
FROM programmed_classes pc
WHERE pc.created_by = 'bd464755-a2ea-4759-90fb-e562b6f28884';
