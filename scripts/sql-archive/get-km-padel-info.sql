-- Get Victor and Carlos profile IDs
SELECT id, full_name, email, role 
FROM profiles 
WHERE email IN ('victorizquierdo1995@gmail.com', 'carloshspadel@gmail.com');

-- Get all programmed classes for KM Pádel club
SELECT 
  pc.id,
  pc.class_name,
  pc.day_of_week,
  pc.start_time,
  pc.end_time,
  pc.trainer_profile_id,
  pc.trainer_profile_id_2,
  t.full_name as trainer_name,
  t2.full_name as trainer_2_name
FROM programmed_classes pc
LEFT JOIN profiles t ON t.id = pc.trainer_profile_id
LEFT JOIN profiles t2 ON t2.id = pc.trainer_profile_id_2
WHERE pc.club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND pc.status = 'active'
ORDER BY 
  CASE pc.day_of_week 
    WHEN 'monday' THEN 1 
    WHEN 'tuesday' THEN 2 
    WHEN 'wednesday' THEN 3 
    WHEN 'thursday' THEN 4 
    WHEN 'friday' THEN 5 
    WHEN 'saturday' THEN 6 
    WHEN 'sunday' THEN 7 
  END,
  pc.start_time;
