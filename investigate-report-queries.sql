-- ═══════════════════════════════════════════════════════════════
-- INVESTIGACIÓN REPORTE MAÑANA 12 NOV 2025
-- Ejecuta estas queries en el SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1. VER LOGS DE EJECUCIÓN DE REPORTES (últimas 24 horas)
-- ─────────────────────────────────────────────────────────────
SELECT
  created_at,
  log_level,
  message,
  details
FROM cron_debug_logs
WHERE function_name = 'generate-daily-report'
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;


-- 2. VERIFICAR ID DEL CLUB HESPÉRIDES
-- ─────────────────────────────────────────────────────────────
SELECT id, name
FROM clubs
WHERE name ILIKE '%hespérides%';


-- 3. CONFIGURACIÓN WHATSAPP REPORTS PARA HESPÉRIDES
-- ─────────────────────────────────────────────────────────────
SELECT *
FROM whatsapp_report_groups
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';


-- 4. CLASES PROGRAMADAS ACTIVAS EN RANGO DE FECHAS (sin filtrar por día)
-- ─────────────────────────────────────────────────────────────
SELECT
  pc.id,
  pc.name,
  pc.start_time,
  pc.duration_minutes,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  pc.max_participants,
  pc.is_active,
  p.full_name as trainer_name
FROM programmed_classes pc
LEFT JOIN profiles p ON p.id = pc.trainer_profile_id
WHERE pc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND pc.is_active = true
  AND pc.start_date <= '2025-11-12'
  AND pc.end_date >= '2025-11-12'
ORDER BY pc.start_time;


-- 5. CLASES QUE DEBERÍAN APARECER HOY MIÉRCOLES (con filtro de día)
-- ─────────────────────────────────────────────────────────────
SELECT
  pc.id,
  pc.name,
  pc.start_time,
  pc.duration_minutes,
  pc.days_of_week,
  pc.start_date,
  pc.end_date,
  pc.max_participants,
  pc.is_active,
  p.full_name as trainer_name,
  CASE
    WHEN 'miércoles' = ANY(pc.days_of_week) THEN '✅ SÍ'
    ELSE '❌ NO'
  END as incluye_miercoles
FROM programmed_classes pc
LEFT JOIN profiles p ON p.id = pc.trainer_profile_id
WHERE pc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND pc.is_active = true
  AND pc.start_date <= '2025-11-12'
  AND pc.end_date >= '2025-11-12'
  AND 'miércoles' = ANY(pc.days_of_week)
ORDER BY pc.start_time;


-- 6. PARTICIPANTES CON CONFIRMACIONES PARA HOY
-- ─────────────────────────────────────────────────────────────
SELECT
  cp.id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.attendance_confirmed_at,
  cp.absence_confirmed,
  cp.absence_reason,
  pc.name as class_name,
  pc.start_time,
  se.full_name as student_name
FROM class_participants cp
JOIN programmed_classes pc ON pc.id = cp.programmed_class_id
LEFT JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE cp.attendance_confirmed_for_date = '2025-11-12'
  AND pc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
ORDER BY pc.start_time, se.full_name;


-- 7. CONTAR CLASES POR DÍA DE LA SEMANA (para entender distribución)
-- ─────────────────────────────────────────────────────────────
SELECT
  UNNEST(days_of_week) as dia,
  COUNT(*) as num_clases
FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND is_active = true
  AND start_date <= '2025-11-12'
  AND end_date >= '2025-11-12'
GROUP BY dia
ORDER BY
  CASE UNNEST(days_of_week)
    WHEN 'lunes' THEN 1
    WHEN 'martes' THEN 2
    WHEN 'miércoles' THEN 3
    WHEN 'jueves' THEN 4
    WHEN 'viernes' THEN 5
    WHEN 'sábado' THEN 6
    WHEN 'domingo' THEN 7
  END;


-- 8. VER SI HAY CLASES CON days_of_week VACÍO O NULL
-- ─────────────────────────────────────────────────────────────
SELECT
  id,
  name,
  start_time,
  days_of_week,
  start_date,
  end_date,
  is_active
FROM programmed_classes
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND (days_of_week IS NULL OR days_of_week = '{}')
  AND start_date <= '2025-11-12'
  AND end_date >= '2025-11-12';


-- 9. VERIFICAR QUE LA FECHA DE HOY ESTÉ EN EL FORMATO CORRECTO
-- ─────────────────────────────────────────────────────────────
SELECT
  CURRENT_DATE as fecha_servidor,
  '2025-11-12'::date as fecha_esperada,
  TO_CHAR(CURRENT_DATE, 'Day') as dia_semana_ingles,
  TO_CHAR(CURRENT_DATE, 'TMDay', 'es_ES') as dia_semana_espanol;


-- ═══════════════════════════════════════════════════════════════
-- NOTAS:
-- - El reporte se envió a las 10:13 según tu mensaje
-- - Debería haber usado la fecha 2025-11-12 (miércoles)
-- - El club_id de Hespérides es: 7b6f49ae-d496-407b-bca1-f5f1e9370610
-- - Revisa especialmente la query #5 para ver si hay clases programadas
-- ═══════════════════════════════════════════════════════════════
