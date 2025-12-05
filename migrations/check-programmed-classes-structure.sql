-- Ver estructura de la tabla programmed_classes

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'programmed_classes'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver un ejemplo de datos
SELECT id, name, start_time, end_date, location, days_of_week
FROM programmed_classes
LIMIT 3;
