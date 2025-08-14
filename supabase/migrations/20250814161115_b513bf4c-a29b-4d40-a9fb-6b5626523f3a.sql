-- Eliminar el método anterior y crear uno mejor usando cron jobs
-- Primero, crear la función que procesará las notificaciones programadas

-- Volver al método directo pero con AFTER INSERT y mejor manejo
DROP TRIGGER IF EXISTS trigger_notify_new_class ON programmed_classes;

-- Recrear la función notify_new_class para usar directamente la función HTTP
CREATE OR REPLACE FUNCTION public.notify_new_class()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Solo para clases nuevas que están activas
  IF NEW.is_active = true THEN
    -- Llamar directamente a la función con el ID correcto
    PERFORM extensions.http_post(
      'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/notify-waitlist',
      json_build_object(
        'classId', NEW.id::text,
        'availableSpots', NEW.max_participants
      )::text,
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear el trigger AFTER INSERT para que se ejecute después de que la transacción se complete
CREATE TRIGGER trigger_notify_new_class
    AFTER INSERT ON programmed_classes
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_class();