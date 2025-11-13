-- Script para verificar la clase de prueba creada

-- 1. Ver TODAS las clases programadas para HOY
SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.start_date,
    pc.end_date,
    pc.is_active,
    pc.days_of_week,
    c.name as club_name,
    -- Calcular si está en el rango de 6-7h
    (CURRENT_DATE || ' ' || pc.start_time)::timestamp as class_datetime,
    NOW() + INTERVAL '6 hours' as six_hours_from_now,
    NOW() + INTERVAL '7 hours' as seven_hours_from_now,
    CASE
        WHEN (CURRENT_DATE || ' ' || pc.start_time)::timestamp BETWEEN
             NOW() + INTERVAL '6 hours' AND NOW() + INTERVAL '7 hours'
        THEN '✅ EN RANGO 6-7h'
        ELSE '❌ FUERA DE RANGO'
    END as status
FROM programmed_classes pc
JOIN clubs c ON c.id = pc.club_id
WHERE pc.start_time = '23:30:00'
   OR pc.name LIKE '%Prueba%'
   OR pc.name LIKE '%Test%'
ORDER BY pc.created_at DESC
LIMIT 10;

-- 2. Ver si la clase cumple TODOS los requisitos
SELECT
    pc.id,
    pc.name,
    pc.start_time,
    -- Verificar cada requisito
    CASE WHEN pc.is_active = true THEN '✅' ELSE '❌' END as "is_active",
    CASE WHEN CURRENT_DATE BETWEEN pc.start_date AND pc.end_date THEN '✅' ELSE '❌' END as "fecha_valida",
    CASE WHEN (CURRENT_DATE || ' ' || pc.start_time)::timestamp BETWEEN
              NOW() + INTERVAL '6 hours' AND NOW() + INTERVAL '7 hours'
         THEN '✅' ELSE '❌' END as "en_rango_6-7h",
    -- Datos de fechas
    pc.start_date,
    pc.end_date,
    CURRENT_DATE as today,
    -- Tiempo hasta la clase
    (CURRENT_DATE || ' ' || pc.start_time)::timestamp - NOW() as tiempo_hasta_clase
FROM programmed_classes pc
WHERE pc.start_time = '23:30:00'
   OR pc.name LIKE '%Prueba%'
   OR pc.name LIKE '%Test%'
ORDER BY pc.created_at DESC
LIMIT 5;

-- 3. Ver participantes de la clase (si existen)
SELECT
    pc.name as class_name,
    pc.start_time,
    se.full_name,
    se.email,
    cp.status as participant_status,
    cp.attendance_confirmed_for_date,
    cp.absence_confirmed,
    CASE
        WHEN cp.attendance_confirmed_for_date IS NULL AND cp.absence_confirmed IS NULL
        THEN '⚠️ SIN CONFIRMAR (Debería recibir email)'
        WHEN cp.attendance_confirmed_for_date IS NOT NULL
        THEN '✅ ASISTENCIA CONFIRMADA'
        WHEN cp.absence_confirmed = true
        THEN '❌ AUSENCIA CONFIRMADA'
    END as confirmation_status
FROM programmed_classes pc
LEFT JOIN class_participants cp ON cp.class_id = pc.id
LEFT JOIN student_enrollments se ON se.id = cp.student_enrollment_id
WHERE (pc.start_time = '23:30:00' OR pc.name LIKE '%Prueba%' OR pc.name LIKE '%Test%')
  AND (cp.id IS NULL OR cp.status = 'active')
ORDER BY pc.name, se.full_name;

-- 4. Resumen rápido
SELECT
    'Clases a las 23:30 hoy' as descripcion,
    COUNT(*) as cantidad
FROM programmed_classes pc
WHERE pc.start_time = '23:30:00'
  AND CURRENT_DATE BETWEEN pc.start_date AND pc.end_date
  AND pc.is_active = true;

-- 5. Verificar el rango de horas exacto
SELECT
    NOW() as hora_actual,
    NOW() + INTERVAL '6 hours' as inicio_rango,
    NOW() + INTERVAL '7 hours' as fin_rango,
    '23:30:00'::time as hora_clase,
    (CURRENT_DATE || ' 23:30:00')::timestamp as datetime_clase,
    CASE
        WHEN (CURRENT_DATE || ' 23:30:00')::timestamp BETWEEN
             NOW() + INTERVAL '6 hours' AND NOW() + INTERVAL '7 hours'
        THEN '✅ La clase de 23:30 ESTÁ en el rango'
        ELSE '❌ La clase de 23:30 NO está en el rango'
    END as resultado;
