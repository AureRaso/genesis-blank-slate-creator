-- Deshabilitar triggers problemáticos que causan timeouts
-- Estos triggers llaman edge functions que están bloqueando las operaciones

-- 1. Deshabilitar el trigger que detecta spots disponibles en class_participants  
DROP TRIGGER IF EXISTS notify_available_spot_trigger ON class_participants;
DROP TRIGGER IF EXISTS trigger_detect_available_spots_trigger ON class_participants;

-- 2. Deshabilitar triggers similares en otras tablas si existen
DROP TRIGGER IF EXISTS detect_spots_trigger ON programmed_classes;
DROP TRIGGER IF EXISTS notify_spots_trigger ON programmed_classes;

-- 3. Crear un trigger más simple y eficiente solo para actualizaciones necesarias
-- En lugar de llamar edge functions sincrónicamente, solo log simple
CREATE OR REPLACE FUNCTION simple_log_change() 
RETURNS TRIGGER AS $$
BEGIN
  -- Log simple sin llamadas HTTP que causan timeouts
  RAISE NOTICE 'Class participant change: %', NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario: Los triggers HTTP síncronos han sido removidos para evitar timeouts
-- Se pueden reactivar más tarde con una estrategia asíncrona mejorada