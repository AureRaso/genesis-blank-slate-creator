-- ============================================
-- ANÁLISIS ESPECÍFICO DEL BAN - 19:00-19:30 del 29 de diciembre
-- ============================================

-- ¿Qué cron se ejecutó a las 19:00?
-- El cron corre cada 30 min: ..., 18:30, 19:00, 19:30, ...
-- A las 19:00 se envían recordatorios para clases del 30 dic entre 19:00-19:30

SELECT
  'Ejecución del cron a las 19:00 del 29 dic' as momento,
  'Envía recordatorios para clases del 30 dic entre 19:00-19:30' as accion;

-- 1. ¿Cuántos mensajes se enviaron en la ejecución de las 19:00?
WITH clases_afectadas AS (
  SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.club_id,
    c.name as club_name,
    cp.student_enrollment_id,
    se.email,
    se.phone,
    se.full_name
  FROM programmed_classes pc
  JOIN clubs c ON pc.club_id = c.id
  JOIN class_participants cp ON pc.id = cp.class_id
    AND cp.status = 'active'
  JOIN student_enrollments se ON cp.student_enrollment_id = se.id
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['martes']  -- 30 dic es martes
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    -- Ventana de envío: clases entre 19:00 y 19:30
    AND pc.start_time::time >= '19:00:00'::time
    AND pc.start_time::time < '19:30:00'::time
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d',  -- Gali
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',  -- La Red 21
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',  -- SVQ Academy
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',  -- Fuente Viña
      'a994e74e-0a7f-4721-8c0f-e23100a01614',  -- Wild Padel
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'   -- Hespérides
    )
)
SELECT
  club_name,
  name as clase,
  start_time,
  COUNT(*) as num_mensajes,
  string_agg(full_name, ', ') as alumnos
FROM clases_afectadas
GROUP BY club_name, name, start_time
ORDER BY club_name, start_time;

-- 2. TOTAL de mensajes en la ejecución de las 19:00
WITH clases_afectadas AS (
  SELECT
    cp.student_enrollment_id
  FROM programmed_classes pc
  JOIN class_participants cp ON pc.id = cp.class_id
    AND cp.status = 'active'
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['martes']
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    AND pc.start_time::time >= '19:00:00'::time
    AND pc.start_time::time < '19:30:00'::time
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d',
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
)
SELECT
  COUNT(DISTINCT student_enrollment_id) as total_mensajes_enviados_a_las_19h,
  '🚨 ESTE ES EL VOLUMEN QUE CAUSÓ EL BAN' as alerta;

-- 3. ¿Cuántos mensajes se enviaron en TODAS las ejecuciones anteriores ese día?
WITH todas_las_ejecuciones AS (
  SELECT
    CASE
      WHEN pc.start_time::time >= '00:00:00' AND pc.start_time::time < '00:30:00' THEN '00:00'
      WHEN pc.start_time::time >= '00:30:00' AND pc.start_time::time < '01:00:00' THEN '00:30'
      WHEN pc.start_time::time >= '01:00:00' AND pc.start_time::time < '01:30:00' THEN '01:00'
      WHEN pc.start_time::time >= '01:30:00' AND pc.start_time::time < '02:00:00' THEN '01:30'
      WHEN pc.start_time::time >= '02:00:00' AND pc.start_time::time < '02:30:00' THEN '02:00'
      WHEN pc.start_time::time >= '02:30:00' AND pc.start_time::time < '03:00:00' THEN '02:30'
      WHEN pc.start_time::time >= '03:00:00' AND pc.start_time::time < '03:30:00' THEN '03:00'
      WHEN pc.start_time::time >= '03:30:00' AND pc.start_time::time < '04:00:00' THEN '03:30'
      WHEN pc.start_time::time >= '04:00:00' AND pc.start_time::time < '04:30:00' THEN '04:00'
      WHEN pc.start_time::time >= '04:30:00' AND pc.start_time::time < '05:00:00' THEN '04:30'
      WHEN pc.start_time::time >= '05:00:00' AND pc.start_time::time < '05:30:00' THEN '05:00'
      WHEN pc.start_time::time >= '05:30:00' AND pc.start_time::time < '06:00:00' THEN '05:30'
      WHEN pc.start_time::time >= '06:00:00' AND pc.start_time::time < '06:30:00' THEN '06:00'
      WHEN pc.start_time::time >= '06:30:00' AND pc.start_time::time < '07:00:00' THEN '06:30'
      WHEN pc.start_time::time >= '07:00:00' AND pc.start_time::time < '07:30:00' THEN '07:00'
      WHEN pc.start_time::time >= '07:30:00' AND pc.start_time::time < '08:00:00' THEN '07:30'
      WHEN pc.start_time::time >= '08:00:00' AND pc.start_time::time < '08:30:00' THEN '08:00'
      WHEN pc.start_time::time >= '08:30:00' AND pc.start_time::time < '09:00:00' THEN '08:30'
      WHEN pc.start_time::time >= '09:00:00' AND pc.start_time::time < '09:30:00' THEN '09:00'
      WHEN pc.start_time::time >= '09:30:00' AND pc.start_time::time < '10:00:00' THEN '09:30'
      WHEN pc.start_time::time >= '10:00:00' AND pc.start_time::time < '10:30:00' THEN '10:00'
      WHEN pc.start_time::time >= '10:30:00' AND pc.start_time::time < '11:00:00' THEN '10:30'
      WHEN pc.start_time::time >= '11:00:00' AND pc.start_time::time < '11:30:00' THEN '11:00'
      WHEN pc.start_time::time >= '11:30:00' AND pc.start_time::time < '12:00:00' THEN '11:30'
      WHEN pc.start_time::time >= '12:00:00' AND pc.start_time::time < '12:30:00' THEN '12:00'
      WHEN pc.start_time::time >= '12:30:00' AND pc.start_time::time < '13:00:00' THEN '12:30'
      WHEN pc.start_time::time >= '13:00:00' AND pc.start_time::time < '13:30:00' THEN '13:00'
      WHEN pc.start_time::time >= '13:30:00' AND pc.start_time::time < '14:00:00' THEN '13:30'
      WHEN pc.start_time::time >= '14:00:00' AND pc.start_time::time < '14:30:00' THEN '14:00'
      WHEN pc.start_time::time >= '14:30:00' AND pc.start_time::time < '15:00:00' THEN '14:30'
      WHEN pc.start_time::time >= '15:00:00' AND pc.start_time::time < '15:30:00' THEN '15:00'
      WHEN pc.start_time::time >= '15:30:00' AND pc.start_time::time < '16:00:00' THEN '15:30'
      WHEN pc.start_time::time >= '16:00:00' AND pc.start_time::time < '16:30:00' THEN '16:00'
      WHEN pc.start_time::time >= '16:30:00' AND pc.start_time::time < '17:00:00' THEN '16:30'
      WHEN pc.start_time::time >= '17:00:00' AND pc.start_time::time < '17:30:00' THEN '17:00'
      WHEN pc.start_time::time >= '17:30:00' AND pc.start_time::time < '18:00:00' THEN '17:30'
      WHEN pc.start_time::time >= '18:00:00' AND pc.start_time::time < '18:30:00' THEN '18:00'
      WHEN pc.start_time::time >= '18:30:00' AND pc.start_time::time < '19:00:00' THEN '18:30'
      WHEN pc.start_time::time >= '19:00:00' AND pc.start_time::time < '19:30:00' THEN '19:00'
      WHEN pc.start_time::time >= '19:30:00' AND pc.start_time::time < '20:00:00' THEN '19:30'
      WHEN pc.start_time::time >= '20:00:00' AND pc.start_time::time < '20:30:00' THEN '20:00'
      WHEN pc.start_time::time >= '20:30:00' AND pc.start_time::time < '21:00:00' THEN '20:30'
      WHEN pc.start_time::time >= '21:00:00' AND pc.start_time::time < '21:30:00' THEN '21:00'
      WHEN pc.start_time::time >= '21:30:00' AND pc.start_time::time < '22:00:00' THEN '21:30'
      WHEN pc.start_time::time >= '22:00:00' AND pc.start_time::time < '22:30:00' THEN '22:00'
      WHEN pc.start_time::time >= '22:30:00' AND pc.start_time::time < '23:00:00' THEN '22:30'
      WHEN pc.start_time::time >= '23:00:00' AND pc.start_time::time < '23:30:00' THEN '23:00'
      WHEN pc.start_time::time >= '23:30:00' AND pc.start_time::time <= '23:59:59' THEN '23:30'
    END as hora_ejecucion_cron,
    COUNT(DISTINCT cp.student_enrollment_id) as mensajes
  FROM programmed_classes pc
  JOIN class_participants cp ON pc.id = cp.class_id AND cp.status = 'active'
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['martes']
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d',
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
  GROUP BY hora_ejecucion_cron
)
SELECT
  hora_ejecucion_cron as hora_cron,
  mensajes,
  CASE
    WHEN hora_ejecucion_cron = '19:00' THEN '🔴 MOMENTO DEL BAN'
    WHEN mensajes > 40 THEN '🟡 PICO ALTO'
    WHEN mensajes > 0 THEN '🟢 Normal'
    ELSE '⚪ Sin envíos'
  END as estado
FROM todas_las_ejecuciones
WHERE mensajes > 0
ORDER BY hora_ejecucion_cron;

-- 4. Comparación: ¿Envío de las 19:00 vs promedio del día?
WITH estadisticas AS (
  SELECT
    CASE
      WHEN pc.start_time::time >= '19:00:00' AND pc.start_time::time < '19:30:00' THEN 'pico_19h'
      ELSE 'resto_del_dia'
    END as periodo,
    COUNT(DISTINCT cp.student_enrollment_id) as mensajes
  FROM programmed_classes pc
  JOIN class_participants cp ON pc.id = cp.class_id AND cp.status = 'active'
  WHERE
    pc.is_active = true
    AND pc.days_of_week @> ARRAY['martes']
    AND pc.start_date <= '2025-12-30'
    AND pc.end_date >= '2025-12-30'
    AND pc.club_id IN (
      'cc0a5265-99c5-4b99-a479-5334280d0c6d',
      'bbc10821-1c94-4b62-97ac-2fde0708cefd',
      '09e8aa4e-69fa-4432-aedb-e7f831b3ebcc',
      'df335578-b68b-4d3f-83e1-d5d7ff16d23c',
      'a994e74e-0a7f-4721-8c0f-e23100a01614',
      '7b6f49ae-d496-407b-bca1-f5f1e9370610'
    )
  GROUP BY periodo
)
SELECT
  periodo,
  mensajes,
  ROUND((mensajes::numeric / NULLIF((SELECT SUM(mensajes) FROM estadisticas), 0)) * 100, 1) as porcentaje_del_total
FROM estadisticas;
