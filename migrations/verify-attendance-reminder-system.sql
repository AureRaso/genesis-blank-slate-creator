-- ====================================
-- VERIFICACIÓN DEL SISTEMA DE RECORDATORIOS DE ASISTENCIA
-- ====================================

-- 1. Verificar si el cron job existe y está activo
SELECT
    jobid,
    jobname,
    schedule,
    active,
    nodename,
    database
FROM cron.job
WHERE jobname = 'send-attendance-reminders-hourly';

-- 2. Ver el historial de ejecuciones del cron job (últimas 10)
SELECT
    runid,
    jobid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid IN (
    SELECT jobid FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly'
)
ORDER BY start_time DESC
LIMIT 10;

-- 3. Verificar clases que están en el rango de 6-7 horas desde ahora
WITH time_window AS (
    SELECT NOW() AS now,
           NOW() + INTERVAL '6 hours' AS six_hours_from_now,
           NOW() + INTERVAL '7 hours' AS seven_hours_from_now,
           CURRENT_DATE AS today
)
SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.start_date,
    pc.end_date,
    c.name as club_name,
    -- Construir la fecha/hora completa de la clase
    (CURRENT_DATE || ' ' || pc.start_time)::timestamp as class_datetime,
    -- Verificar si está en el rango
    CASE
        WHEN (CURRENT_DATE || ' ' || pc.start_time)::timestamp BETWEEN
             (SELECT six_hours_from_now FROM time_window) AND
             (SELECT seven_hours_from_now FROM time_window)
        THEN '✅ EN RANGO (6-7h)'
        ELSE '❌ FUERA DE RANGO'
    END as status
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
WHERE pc.is_active = true
    AND CURRENT_DATE BETWEEN pc.start_date AND pc.end_date
ORDER BY pc.start_time;

-- 4. Verificar participantes sin confirmación en las próximas clases
WITH target_classes AS (
    SELECT
        pc.id,
        pc.name,
        pc.start_time,
        c.name as club_name
    FROM programmed_classes pc
    JOIN clubs c ON c.id = pc.club_id
    WHERE pc.is_active = true
        AND CURRENT_DATE BETWEEN pc.start_date AND pc.end_date
        AND (CURRENT_DATE || ' ' || pc.start_time)::timestamp BETWEEN
            NOW() + INTERVAL '6 hours' AND
            NOW() + INTERVAL '7 hours'
)
SELECT
    tc.name as class_name,
    tc.start_time,
    tc.club_name,
    COUNT(*) as total_participants,
    COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NULL AND cp.absence_confirmed IS NULL) as unconfirmed_count,
    COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL) as confirmed_attendance,
    COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as confirmed_absence
FROM target_classes tc
LEFT JOIN class_participants cp ON cp.class_id = tc.id AND cp.status = 'active'
GROUP BY tc.name, tc.start_time, tc.club_name;

-- 5. Detalle de participantes sin confirmar (con sus emails)
WITH target_classes_detail AS (
    SELECT
        pc.id,
        pc.name,
        pc.start_time,
        c.name as club_name
    FROM programmed_classes pc
    JOIN clubs c ON c.id = pc.club_id
    WHERE pc.is_active = true
        AND CURRENT_DATE BETWEEN pc.start_date AND pc.end_date
        AND (CURRENT_DATE || ' ' || pc.start_time)::timestamp BETWEEN
            NOW() + INTERVAL '6 hours' AND
            NOW() + INTERVAL '7 hours'
)
SELECT
    tcd.name as class_name,
    tcd.start_time,
    se.full_name,
    se.email,
    cp.attendance_confirmed_for_date,
    cp.absence_confirmed,
    CASE
        WHEN cp.attendance_confirmed_for_date IS NULL AND cp.absence_confirmed IS NULL
        THEN '⚠️ SIN CONFIRMAR - DEBERÍA RECIBIR EMAIL'
        WHEN cp.attendance_confirmed_for_date IS NOT NULL
        THEN '✅ ASISTENCIA CONFIRMADA'
        WHEN cp.absence_confirmed = true
        THEN '❌ AUSENCIA CONFIRMADA'
    END as status
FROM target_classes_detail tcd
JOIN class_participants cp ON cp.class_id = tcd.id AND cp.status = 'active'
JOIN student_enrollments se ON se.id = cp.student_enrollment_id
ORDER BY tcd.start_time, se.full_name;

-- 6. Verificar configuración de la Edge Function
SELECT
    current_setting('app.settings.service_role_key', true) as service_role_key_configured;

-- 7. Resumen del estado del sistema
SELECT
    '1. Cron Job Configurado' as check_item,
    CASE
        WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-attendance-reminders-hourly' AND active = true)
        THEN '✅ SÍ'
        ELSE '❌ NO'
    END as status
UNION ALL
SELECT
    '2. Clases en rango 6-7h' as check_item,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM programmed_classes pc
            WHERE pc.is_active = true
                AND CURRENT_DATE BETWEEN pc.start_date AND pc.end_date
                AND (CURRENT_DATE || ' ' || pc.start_time)::timestamp BETWEEN
                    NOW() + INTERVAL '6 hours' AND
                    NOW() + INTERVAL '7 hours'
        )
        THEN '✅ SÍ'
        ELSE '⚠️ NO (ninguna clase en ese rango ahora)'
    END as status
UNION ALL
SELECT
    '3. Participantes sin confirmar' as check_item,
    COALESCE(
        (SELECT COUNT(*)::text FROM class_participants cp
         JOIN programmed_classes pc ON pc.id = cp.class_id
         WHERE pc.is_active = true
             AND CURRENT_DATE BETWEEN pc.start_date AND pc.end_date
             AND (CURRENT_DATE || ' ' || pc.start_time)::timestamp BETWEEN
                 NOW() + INTERVAL '6 hours' AND
                 NOW() + INTERVAL '7 hours'
             AND cp.status = 'active'
             AND cp.attendance_confirmed_for_date IS NULL
             AND cp.absence_confirmed IS NULL),
        '0'
    ) || ' participantes' as status;
