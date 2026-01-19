-- 1. Verificar si la clase existe y su estado
SELECT 
    id,
    name,
    club_id,
    trainer_id,
    day_of_week,
    start_time,
    end_time,
    capacity,
    is_active,
    deleted_at,
    created_at,
    updated_at
FROM scheduled_classes 
WHERE id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';

-- 2. Verificar si hay soft delete o si está inactiva
SELECT 
    id,
    name,
    is_active,
    deleted_at,
    CASE 
        WHEN deleted_at IS NOT NULL THEN 'SOFT DELETED'
        WHEN is_active = false THEN 'INACTIVE'
        ELSE 'SHOULD BE VISIBLE'
    END as status_reason
FROM scheduled_classes 
WHERE id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';

-- 3. Verificar el club asociado
SELECT 
    sc.id as class_id,
    sc.name as class_name,
    sc.club_id,
    c.name as club_name,
    c.status as club_status
FROM scheduled_classes sc
LEFT JOIN clubs c ON sc.club_id = c.id
WHERE sc.id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019';

-- 4. Verificar todas las clases activas de La Red 21 Galisport
SELECT 
    id,
    name,
    day_of_week,
    start_time,
    is_active,
    deleted_at
FROM scheduled_classes 
WHERE club_id = 'bbc10821-1c94-4b62-97ac-2fde0708cefd'
ORDER BY day_of_week, start_time;

-- 5. Ver logs de auditoría si existen (audit_logs table)
SELECT * FROM audit_logs 
WHERE table_name = 'scheduled_classes' 
AND record_id = 'db1ddcc3-ab6b-49fa-9f07-41e11f5e8019'
ORDER BY created_at DESC
LIMIT 10;
