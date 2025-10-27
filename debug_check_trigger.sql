-- Ver si el trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_absence_marked';

-- Verificar la estructura de class_participants
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'class_participants'
ORDER BY ordinal_position;

-- Ver la ausencia del jugador Mark (corregido)
SELECT 
  cp.id,
  cp.absence_confirmed,
  cp.absence_confirmed_at,
  se.email,
  se.full_name,
  se.level
FROM class_participants cp
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE se.email = 'mark@gmail.com'
  AND cp.absence_confirmed = TRUE
ORDER BY cp.absence_confirmed_at DESC
LIMIT 5;
