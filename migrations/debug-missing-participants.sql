-- Debug: Find the 20 missing participants
WITH tomorrow_date AS (
  SELECT (CURRENT_DATE + INTERVAL '1 day')::date as tomorrow
),
tomorrow_day_names AS (
  SELECT
    td.tomorrow,
    CASE EXTRACT(DOW FROM td.tomorrow)
      WHEN 0 THEN ARRAY['domingo']
      WHEN 1 THEN ARRAY['lunes']
      WHEN 2 THEN ARRAY['martes']
      WHEN 3 THEN ARRAY['miercoles', 'miércoles']
      WHEN 4 THEN ARRAY['jueves']
      WHEN 5 THEN ARRAY['viernes']
      WHEN 6 THEN ARRAY['sabado', 'sábado']
    END as day_names
  FROM tomorrow_date td
),
tomorrow_classes AS (
  SELECT
    c.id as class_id,
    c.name as class_name
  FROM programmed_classes c
  CROSS JOIN tomorrow_day_names tdn
  JOIN clubs cl ON c.club_id = cl.id
  WHERE cl.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    AND c.is_active = true
    AND c.start_date <= tdn.tomorrow
    AND c.end_date >= tdn.tomorrow
    AND c.days_of_week && tdn.day_names
),
all_participants AS (
  SELECT
    tc.class_name,
    se.full_name as student_name,
    se.phone as student_phone,
    CASE
      WHEN se.phone IS NULL THEN 'NULL'
      WHEN se.phone = '' THEN 'EMPTY'
      WHEN se.phone = '000000000' THEN 'INVALID (000000000)'
      ELSE 'VALID'
    END as phone_status
  FROM tomorrow_classes tc
  JOIN class_participants cp ON tc.class_id = cp.class_id
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  WHERE cp.status = 'active'
)

SELECT
  phone_status as "Estado Teléfono",
  COUNT(*) as "Cantidad",
  string_agg(DISTINCT student_name, ', ') as "Ejemplos (primeros nombres)"
FROM all_participants
GROUP BY phone_status
ORDER BY COUNT(*) DESC;
