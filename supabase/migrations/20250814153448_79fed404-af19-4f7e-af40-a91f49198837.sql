-- Corregir funciones para cumplir con las mejores prácticas de seguridad

-- Corregir función notify_available_spot con search_path seguro
CREATE OR REPLACE FUNCTION notify_available_spot()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Solo ejecutar si el estado cambió a inactivo
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    -- Llamar a la función de detección de plazas disponibles
    PERFORM net.http_post(
      'https://hwwvtxyezhgmhyxjpnvl.supabase.co/functions/v1/detect-available-spots',
      '{"triggered_by": "participant_removal"}',
      'application/json'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Corregir función notify_new_class con search_path seguro
CREATE OR REPLACE FUNCTION notify_new_class()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Solo para clases nuevas que están activas
  IF NEW.is_active = true THEN
    -- Llamar a la función de notificación con delay para permitir que se complete la transacción
    PERFORM net.http_post(
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