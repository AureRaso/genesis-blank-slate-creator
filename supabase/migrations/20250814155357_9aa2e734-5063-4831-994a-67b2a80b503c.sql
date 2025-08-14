-- Actualizar la función notify_new_class para usar el esquema correcto de http_post
CREATE OR REPLACE FUNCTION public.notify_new_class()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Solo para clases nuevas que están activas
  IF NEW.is_active = true THEN
    -- Llamar a la función de notificación usando extensions.http_post
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

-- Actualizar la función notify_available_spot para usar el esquema correcto de http_post
CREATE OR REPLACE FUNCTION public.notify_available_spot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Solo ejecutar si el estado cambió a inactivo
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    -- Llamar a la función de detección de plazas disponibles usando extensions.http_post
    PERFORM extensions.http_post(
      'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/detect-available-spots',
      '{"triggered_by": "participant_removal"}',
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;