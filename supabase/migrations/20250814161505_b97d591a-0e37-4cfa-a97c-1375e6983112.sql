-- Eliminar el trigger problemático para nuevas clases
-- El problema es que aún siendo AFTER INSERT, la función edge no puede ver la clase 
-- Esto puede ser debido a problemas de transacciones o RLS

DROP TRIGGER IF EXISTS trigger_notify_new_class ON programmed_classes;
DROP FUNCTION IF EXISTS public.notify_new_class();

-- En su lugar, vamos a confiar en el cron job que detecta plazas disponibles
-- que ya funciona correctamente para notificar sobre nuevas clases también

-- Crear una vista para ayudar a debug los problemas
CREATE OR REPLACE VIEW public.debug_classes AS
SELECT 
    pc.id,
    pc.name,
    pc.max_participants,
    pc.created_at,
    pc.is_active,
    c.name as club_name,
    COALESCE(cp.participant_count, 0) as current_participants,
    (pc.max_participants - COALESCE(cp.participant_count, 0)) as available_spots
FROM programmed_classes pc
LEFT JOIN clubs c ON pc.club_id = c.id
LEFT JOIN (
    SELECT 
        class_id, 
        COUNT(*) as participant_count 
    FROM class_participants 
    WHERE status = 'active' 
    GROUP BY class_id
) cp ON pc.id = cp.class_id
WHERE pc.is_active = true;