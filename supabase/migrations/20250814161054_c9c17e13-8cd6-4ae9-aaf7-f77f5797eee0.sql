-- Primero eliminar el trigger existente si existe
DROP TRIGGER IF EXISTS trigger_notify_new_class ON programmed_classes;

-- Recrear la función con un pequeño retraso para asegurar que la transacción se complete
CREATE OR REPLACE FUNCTION public.notify_new_class()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Solo para clases nuevas que están activas
  IF NEW.is_active = true THEN
    -- Programar la notificación para ejecutarse después de que la transacción se complete
    PERFORM pg_notify('new_class_created', 
      json_build_object(
        'classId', NEW.id::text,
        'availableSpots', NEW.max_participants
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear el trigger para que se ejecute AFTER INSERT
CREATE TRIGGER trigger_notify_new_class
    AFTER INSERT ON programmed_classes
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_class();

-- También vamos a crear una función que escuche las notificaciones y haga la llamada HTTP
CREATE OR REPLACE FUNCTION public.process_new_class_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    notification_payload text;
    class_data jsonb;
BEGIN
    -- Esta función será llamada por un cron job o manualmente
    -- Por ahora, vamos a usar el approach directo pero con AFTER INSERT
    NULL;
END;
$function$;