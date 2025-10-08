-- Check programmed_classes for Hespérides club
SELECT
  pc.id,
  pc.name,
  pc.club_id,
  c.name as club_name,
  pc.trainer_profile_id,
  p.full_name as trainer_name,
  pc.start_date,
  pc.end_date,
  pc.days_of_week,
  pc.start_time,
  pc.created_at
FROM programmed_classes pc
LEFT JOIN clubs c ON c.id = pc.club_id
LEFT JOIN profiles p ON p.id = pc.trainer_profile_id
WHERE c.name ILIKE '%hespérides%' OR c.name ILIKE '%hesperides%'
ORDER BY pc.created_at DESC;

-- Check scheduled_classes for Hespérides club
SELECT
  sc.id,
  sc.programmed_class_id,
  pc.name as class_name,
  sc.date,
  sc.start_time,
  sc.club_id,
  c.name as club_name,
  sc.created_at
FROM scheduled_classes sc
LEFT JOIN programmed_classes pc ON pc.id = sc.programmed_class_id
LEFT JOIN clubs c ON c.id = sc.club_id
WHERE c.name ILIKE '%hespérides%' OR c.name ILIKE '%hesperides%'
ORDER BY sc.date DESC, sc.start_time
LIMIT 50;

-- Check if there are any programmed_classes created today
SELECT
  pc.id,
  pc.name,
  c.name as club_name,
  pc.created_at
FROM programmed_classes pc
LEFT JOIN clubs c ON c.id = pc.club_id
WHERE pc.created_at > NOW() - INTERVAL '1 hour'
ORDER BY pc.created_at DESC;
