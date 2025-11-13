-- Investigación de la clase "Clase mixta" a las 18:00 que no aparece

-- 1. Buscar la clase "Clase mixta" a las 18:00
SELECT
    id,
    name,
    start_time,
    duration_minutes,
    days_of_week,
    start_date,
    end_date,
    is_active,
    club_id,
    trainer_profile_id,
    max_participants,
    created_at
FROM programmed_classes
WHERE name ILIKE '%clase mixta%'
  AND start_time = '18:00:00'
  AND club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
ORDER BY created_at DESC;

-- 2. Ver TODAS las clases a las 18:00 del club
SELECT
    id,
    name,
    start_time,
    days_of_week,
    is_active,
    start_date,
    end_date
FROM programmed_classes
WHERE start_time = '18:00:00'
  AND club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'
  AND is_active = true
ORDER BY name;

-- 3. Verificar si el miércoles está bien escrito en days_of_week
SELECT
    id,
    name,
    start_time,
    days_of_week,
    -- Mostrar cada día del array por separado
    jsonb_array_elements_text(days_of_week::jsonb) as individual_day,
    -- Mostrar los bytes del string para ver si hay caracteres raros
    encode(convert_to(jsonb_array_elements_text(days_of_week::jsonb), 'UTF8'), 'hex') as hex_bytes
FROM programmed_classes
WHERE name ILIKE '%clase mixta%'
  AND start_time = '18:00:00'
  AND club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa';

-- 4. Verificar las fechas de vigencia para hoy (12 de noviembre de 2025)
SELECT
    id,
    name,
    start_time,
    days_of_week,
    start_date,
    end_date,
    -- Verificar si la clase está activa para hoy
    CASE
        WHEN start_date <= '2025-11-12' AND end_date >= '2025-11-12' THEN 'VIGENTE'
        WHEN start_date > '2025-11-12' THEN 'AÚN NO COMIENZA'
        WHEN end_date < '2025-11-12' THEN 'YA TERMINÓ'
    END as estado_vigencia
FROM programmed_classes
WHERE name ILIKE '%clase mixta%'
  AND start_time = '18:00:00'
  AND club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa';

-- 5. Ver si hay clases canceladas para hoy
SELECT
    cc.id,
    cc.programmed_class_id,
    pc.name,
    pc.start_time,
    cc.cancelled_date,
    cc.cancellation_reason,
    cc.cancelled_at
FROM cancelled_classes cc
JOIN programmed_classes pc ON pc.id = cc.programmed_class_id
WHERE pc.name ILIKE '%clase mixta%'
  AND pc.start_time = '18:00:00'
  AND cc.cancelled_date = '2025-11-12';

-- 6. Comparar con una clase que SÍ aparece (por ejemplo, "Clase mixta" a las 17:00)
SELECT
    'Clase a las 17:00 (SÍ aparece)' as tipo,
    id,
    name,
    start_time,
    days_of_week,
    start_date,
    end_date,
    is_active
FROM programmed_classes
WHERE name ILIKE '%clase mixta%'
  AND start_time = '17:00:00'
  AND club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa'

UNION ALL

SELECT
    'Clase a las 18:00 (NO aparece)' as tipo,
    id,
    name,
    start_time,
    days_of_week,
    start_date,
    end_date,
    is_active
FROM programmed_classes
WHERE name ILIKE '%clase mixta%'
  AND start_time = '18:00:00'
  AND club_id = 'a66741f0-7ac3-4c1b-a7ca-5601959527aa';
