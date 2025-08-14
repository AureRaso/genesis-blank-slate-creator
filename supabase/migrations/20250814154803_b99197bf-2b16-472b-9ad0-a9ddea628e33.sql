-- Corregir los triggers para usar la función HTTP correcta
-- Usar http_post de la extensión http (no net.http_post)

CREATE OR REPLACE FUNCTION notify_available_spot()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Solo ejecutar si el estado cambió a inactivo
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    -- Llamar a la función de detección de plazas disponibles usando http_post
    PERFORM http_post(
      'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/detect-available-spots',
      '{"triggered_by": "participant_removal"}',
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION notify_new_class()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Solo para clases nuevas que están activas
  IF NEW.is_active = true THEN
    -- Llamar a la función de notificación usando http_post
    PERFORM http_post(
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
$$;