-- Check what classes are scheduled for tomorrow (Wednesday Dec 3, 2025) at Hespérides
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
)

SELECT
  c.name as "Nombre Clase",
  c.start_time as "Hora Inicio",
  c.duration_minutes as "Duración",
  TO_CHAR(
    c.start_time + (c.duration_minutes || ' minutes')::interval,
    'HH24:MI:SS'
  ) as "Hora Fin",
  c.court_number as "Pista",
  c.days_of_week as "Días (array)",
  tdn.day_names as "Mañana es",
  c.start_date as "Inicio Programa",
  c.end_date as "Fin Programa",
  tdn.tomorrow as "Fecha Mañana",
  c.is_active as "Activa",
  (SELECT COUNT(*)
   FROM class_participants cp
   WHERE cp.class_id = c.id AND cp.status = 'active') as "Total Participantes",
  (SELECT COUNT(*)
   FROM class_participants cp
   JOIN student_enrollments se ON cp.student_enrollment_id = se.id
   WHERE cp.class_id = c.id
     AND cp.status = 'active'
     AND se.phone IS NOT NULL
     AND se.phone != ''
     AND se.phone != '000000000') as "Con teléfono válido"
FROM programmed_classes c
CROSS JOIN tomorrow_day_names tdn
JOIN clubs cl ON c.club_id = cl.id
WHERE cl.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610' -- Hespérides Padel
  AND c.is_active = true
  AND c.start_date <= tdn.tomorrow
  AND c.end_date >= tdn.tomorrow
  AND c.days_of_week && tdn.day_names  -- Classes that run tomorrow
ORDER BY c.start_time, c.court_number;
