-- Test if we can create a programmed class
-- This will help identify if the issue is with RLS policies

SELECT
  'Testing programmed_classes RLS policies' as test;

-- Try to insert a test class (will rollback, just testing permissions)
BEGIN;

INSERT INTO programmed_classes (
  name,
  duration_minutes,
  start_time,
  days_of_week,
  start_date,
  end_date,
  recurrence_type,
  trainer_profile_id,
  club_id,
  court_number,
  monthly_price,
  max_participants,
  created_by
) VALUES (
  'TEST CLASS',
  60,
  '20:00:00',
  ARRAY['martes'],
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 months',
  'weekly',
  (SELECT id FROM profiles WHERE role = 'trainer' LIMIT 1),
  (SELECT id FROM clubs LIMIT 1),
  1,
  0,
  8,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
) RETURNING id, name;

ROLLBACK;
