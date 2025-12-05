-- Find all triggers on class_participants table
SELECT
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    proname AS function_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'class_participants'::regclass
  AND tgisinternal = false;
