-- Check Testg class data in database
SELECT
  id,
  name,
  days_of_week,
  start_time,
  start_date,
  end_date,
  created_at
FROM programmed_classes
WHERE name = 'Testg'
ORDER BY created_at DESC
LIMIT 1;
