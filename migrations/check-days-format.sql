-- Check how days_of_week are stored in programmed_classes
SELECT
  c.name as "Nombre Clase",
  c.days_of_week as "Formato días_of_week",
  pg_typeof(c.days_of_week) as "Tipo de dato",
  cl.name as "Club"
FROM programmed_classes c
JOIN clubs cl ON c.club_id = cl.id
WHERE cl.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
LIMIT 5;

-- Also check what day number is Wednesday
SELECT
  'Mañana (miércoles 3 dic)' as "Descripción",
  (CURRENT_DATE + INTERVAL '1 day') as "Fecha",
  EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day')) as "Día de semana (número)",
  to_char((CURRENT_DATE + INTERVAL '1 day'), 'Day') as "Nombre día",
  to_char((CURRENT_DATE + INTERVAL '1 day'), 'Dy') as "Nombre corto";
