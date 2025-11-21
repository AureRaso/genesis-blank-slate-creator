-- Ver estructura completa de programmed_classes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'programmed_classes'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver datos de ejemplo (sin especificar campos que no sabemos si existen)
SELECT *
FROM programmed_classes
LIMIT 2;
