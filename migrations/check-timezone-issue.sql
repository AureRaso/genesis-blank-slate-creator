-- Verificar el problema de timezone

-- 1. Ver la hora actual en diferentes zonas
SELECT
    NOW() as utc_now,
    NOW() AT TIME ZONE 'Europe/Madrid' as madrid_now,
    CURRENT_DATE as today,
    CURRENT_TIME as current_time_utc;

-- 2. Ver la clase y cómo se interpreta
SELECT
    pc.id,
    pc.name,
    pc.start_time,
    pc.start_date,
    -- Construir timestamp asumiendo UTC
    (pc.start_date || ' ' || pc.start_time)::timestamp as class_datetime_utc,
    -- Construir timestamp asumiendo Madrid
    (pc.start_date || ' ' || pc.start_time)::timestamp AT TIME ZONE 'Europe/Madrid' as class_datetime_madrid,
    -- Comparar con los rangos
    NOW() + INTERVAL '6 hours' as range_start,
    NOW() + INTERVAL '7 hours' as range_end,
    -- Verificar si está en rango (asumiendo UTC)
    CASE
        WHEN (pc.start_date || ' ' || pc.start_time)::timestamp BETWEEN
             NOW() + INTERVAL '6 hours' AND NOW() + INTERVAL '7 hours'
        THEN '✅ EN RANGO (interpretando como UTC)'
        ELSE '❌ FUERA DE RANGO (interpretando como UTC)'
    END as status_utc
FROM programmed_classes pc
WHERE pc.id = '339c3757-e3f7-4de8-95dd-32f35e8e6b12';

-- 3. Ver qué hora debería tener la clase para estar en el rango
SELECT
    NOW() as ahora_utc,
    NOW() + INTERVAL '6 hours' as debe_empezar_despues_de,
    NOW() + INTERVAL '7 hours' as debe_empezar_antes_de,
    -- Convertir a hora local para saber qué poner
    (NOW() + INTERVAL '6.5 hours')::time as hora_ideal_utc,
    ((NOW() + INTERVAL '6.5 hours') AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Madrid')::time as hora_ideal_madrid;

-- 4. Calcular qué hora poner para que funcione AHORA
SELECT
    'Para que funcione AHORA, la clase debería estar a esta hora:' as mensaje,
    (NOW() + INTERVAL '6 hours' + INTERVAL '30 minutes')::time as hora_utc_recomendada,
    'Pero si tu clase es a las 23:30 hora local Madrid, el start_time debería ser:' as nota,
    '22:30:00' as start_time_correcto_si_es_23_30_madrid;
