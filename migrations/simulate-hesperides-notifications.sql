-- Simulate 24-hour class reminders for Hespérides Padel club
-- This script shows what notifications would be sent without actually sending them

WITH tomorrow_date AS (
  SELECT (CURRENT_DATE + INTERVAL '1 day')::date as tomorrow
),
tomorrow_day_names AS (
  -- Get Spanish day names for tomorrow (with and without accents)
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
  -- Get all programmed classes that run on tomorrow's day of week
  SELECT
    c.id as class_id,
    c.name as class_name,
    c.start_time,
    c.duration_minutes,
    c.club_id,
    cl.name as club_name,
    tdn.tomorrow as scheduled_date,
    c.court_number,
    COALESCE(c.max_participants, 8) as max_players
  FROM programmed_classes c
  CROSS JOIN tomorrow_day_names tdn
  JOIN clubs cl ON c.club_id = cl.id
  WHERE cl.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610' -- Hespérides Padel
    AND c.is_active = true
    AND c.start_date <= tdn.tomorrow
    AND c.end_date >= tdn.tomorrow
    AND c.days_of_week && tdn.day_names  -- Array overlap operator
),

class_participants_tomorrow AS (
  -- Get all participants for tomorrow's classes
  SELECT
    tc.class_id,
    tc.class_name,
    tc.start_time,
    tc.duration_minutes,
    tc.scheduled_date,
    tc.court_number,
    tc.max_players,
    cp.id as participation_id,
    cp.student_enrollment_id,
    cp.attendance_confirmed_at,
    cp.attendance_confirmed_for_date,
    cp.absence_confirmed,
    se.full_name as student_name,
    se.phone as student_phone,
    'es' as preferred_language
  FROM tomorrow_classes tc
  JOIN class_participants cp ON tc.class_id = cp.class_id
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  WHERE cp.status = 'active'
    AND se.phone IS NOT NULL
    AND se.phone != ''
),

students_with_multiple_classes AS (
  -- Group by student to handle multiple classes
  SELECT
    student_enrollment_id,
    student_name,
    student_phone,
    preferred_language,
    COUNT(*) as class_count,
    json_agg(
      json_build_object(
        'class_id', class_id,
        'class_name', class_name,
        'start_time', start_time,
        'duration_minutes', duration_minutes,
        'scheduled_date', scheduled_date,
        'court_number', court_number,
        'participation_id', participation_id,
        'is_confirmed', CASE
          WHEN attendance_confirmed_for_date = scheduled_date THEN true
          ELSE false
        END,
        'is_absent', absence_confirmed
      ) ORDER BY start_time
    ) as classes
  FROM class_participants_tomorrow
  GROUP BY student_enrollment_id, student_name, student_phone, preferred_language
)

-- Final output: Show what would be sent to each student
SELECT
  student_name as "Nombre del Jugador",
  student_phone as "Teléfono",
  class_count as "Clases Mañana",
  CASE
    WHEN class_count = 1 THEN
      -- Single class message format
      E'🎾 ¡Hola ' || student_name || E'! 👋\n\n' ||
      E'Recordatorio de tu clase de MAÑANA:\n\n' ||
      E'📍 Clase: ' || (classes->0->>'class_name') || E'\n' ||
      E'⏰ Horario: ' || TO_CHAR((classes->0->>'start_time')::time, 'HH24:MI') || E' - ' ||
        TO_CHAR(
          ((classes->0->>'start_time')::time +
           ((classes->0->>'duration_minutes')::int || ' minutes')::interval),
          'HH24:MI'
        ) || E'\n' ||
      E'🎾 Pista: ' || COALESCE((classes->0->>'court_number')::text, 'Por asignar') || E'\n' ||
      CASE
        WHEN (classes->0->>'is_confirmed')::boolean THEN E'✅ Asistencia confirmada'
        WHEN (classes->0->>'is_absent')::boolean THEN E'❌ Ausencia confirmada'
        ELSE E'⚠️ Pendiente de confirmar'
      END || E'\n\n' ||
      E'⚠️ Recuerda: Si no puedes asistir, pulsa el botón de abajo.\n\n' ||
      E'🔗 También puedes marcarlo en: https://www.padelock.com/auth\n\n' ||
      E'¡Nos vemos en la pista! 🎾'
    ELSE
      -- Multiple classes message format
      E'🎾 ¡Hola ' || student_name || E'! 👋\n\n' ||
      E'Tienes ' || class_count || E' clases MAÑANA:\n\n' ||
      (
        SELECT string_agg(
          E'📍 Clase ' || (row_number) || E': ' || (class_data->>'class_name') || E'\n' ||
          E'⏰ Horario: ' || TO_CHAR((class_data->>'start_time')::time, 'HH24:MI') || E' - ' ||
            TO_CHAR(
              ((class_data->>'start_time')::time +
               ((class_data->>'duration_minutes')::int || ' minutes')::interval),
              'HH24:MI'
            ) || E'\n' ||
          E'🎾 Pista: ' || COALESCE((class_data->>'court_number')::text, 'Por asignar') || E'\n' ||
          CASE
            WHEN (class_data->>'is_confirmed')::boolean THEN E'✅ Asistencia confirmada'
            WHEN (class_data->>'is_absent')::boolean THEN E'❌ Ausencia confirmada'
            ELSE E'⚠️ Pendiente de confirmar'
          END,
          E'\n\n'
        )
        FROM json_array_elements(classes) WITH ORDINALITY AS t(class_data, row_number)
      ) || E'\n' ||
      E'⚠️ Recuerda: Si no puedes asistir a alguna clase, pulsa el botón correspondiente.\n\n' ||
      E'🔗 También puedes gestionar tu asistencia en: https://www.padelock.com/auth\n\n' ||
      E'¡Nos vemos en la pista! 🎾'
  END as "Mensaje Completo",
  classes as "Detalle de Clases (JSON)"
FROM students_with_multiple_classes
ORDER BY class_count DESC, student_name;
