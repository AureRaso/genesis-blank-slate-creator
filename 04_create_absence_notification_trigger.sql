-- Trigger para crear notificaciones WhatsApp automáticas cuando se marca una ausencia
-- Este trigger se activa cuando un jugador es marcado como ausente en class_participants

-- Primero, crear la función del trigger
CREATE OR REPLACE FUNCTION create_pending_whatsapp_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_student_level INTEGER;
  v_student_profile_id UUID;
  v_student_name TEXT;
  v_student_email TEXT;
  v_target_group_id UUID;
  v_target_group_name TEXT;
  v_class_info RECORD;
  v_today_date DATE;
BEGIN
  -- Solo si se está marcando como ausente (no si se desmarca)
  IF NEW.absence_confirmed = TRUE AND
     (OLD.absence_confirmed IS NULL OR OLD.absence_confirmed = FALSE) THEN

    RAISE NOTICE '🔔 Absence marked for participant %', NEW.id;

    -- Obtener información del estudiante (nivel, profile_id, nombre)
    SELECT
      se.level,
      p.id,
      se.full_name,
      se.email
    INTO
      v_student_level,
      v_student_profile_id,
      v_student_name,
      v_student_email
    FROM student_enrollments se
    LEFT JOIN profiles p ON p.email = se.email
    WHERE se.id = NEW.student_enrollment_id;

    RAISE NOTICE '👤 Student info: level=%, profile_id=%, name=%',
      v_student_level, v_student_profile_id, v_student_name;

    -- Si no se encontró el nivel, usar nivel 1 por defecto
    IF v_student_level IS NULL THEN
      RAISE WARNING '⚠️ Student level not found, defaulting to 1';
      v_student_level := 1;
    END IF;

    -- Obtener información de la clase
    SELECT
      pc.id,
      pc.name,
      pc.start_time,
      pc.duration_minutes,
      pc.club_id
    INTO v_class_info
    FROM programmed_classes pc
    WHERE pc.id IN (
      SELECT programmed_class_id
      FROM class_participants
      WHERE id = NEW.id
    );

    IF v_class_info IS NULL THEN
      RAISE WARNING '⚠️ Class info not found for participant %', NEW.id;
      RETURN NEW;
    END IF;

    RAISE NOTICE '📚 Class info: id=%, name=%, club_id=%',
      v_class_info.id, v_class_info.name, v_class_info.club_id;

    -- Determinar grupo WhatsApp según nivel del estudiante
    SELECT id, group_name
    INTO v_target_group_id, v_target_group_name
    FROM whatsapp_groups
    WHERE club_id = v_class_info.club_id
      AND level_target = v_student_level
      AND is_active = TRUE
    LIMIT 1;

    IF v_target_group_id IS NULL THEN
      RAISE WARNING '⚠️ No WhatsApp group found for level % in club %. Skipping notification.',
        v_student_level, v_class_info.club_id;
      RETURN NEW;
    END IF;

    RAISE NOTICE '📱 Target WhatsApp group: % (id=%)', v_target_group_name, v_target_group_id;

    -- Obtener la fecha de hoy
    v_today_date := CURRENT_DATE;

    -- Insertar notificación pendiente (para enviar en 10 minutos)
    INSERT INTO pending_whatsapp_notifications (
      class_participant_id,
      class_id,
      student_profile_id,
      student_level,
      target_whatsapp_group_id,
      scheduled_for,
      status,
      class_data
    ) VALUES (
      NEW.id,
      v_class_info.id,
      v_student_profile_id,
      v_student_level,
      v_target_group_id,
      NOW() + INTERVAL '10 minutes',
      'pending',
      jsonb_build_object(
        'class_id', v_class_info.id,
        'class_name', v_class_info.name,
        'start_time', v_class_info.start_time,
        'duration_minutes', v_class_info.duration_minutes,
        'class_date', v_today_date,
        'student_name', v_student_name,
        'student_email', v_student_email,
        'student_level', v_student_level,
        'target_group_name', v_target_group_name
      )
    );

    RAISE NOTICE '✅ Pending notification created. Will be sent at %', NOW() + INTERVAL '10 minutes';

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in create_pending_whatsapp_notification: % %', SQLERRM, SQLSTATE;
    RETURN NEW; -- No fallar el update original
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_absence_marked ON class_participants;

-- Crear el trigger
CREATE TRIGGER on_absence_marked
  AFTER UPDATE OF absence_confirmed ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_pending_whatsapp_notification();

COMMENT ON FUNCTION create_pending_whatsapp_notification IS 'Crea notificaciones WhatsApp pendientes cuando se marca una ausencia. La notificación se enviará automáticamente después de 10 minutos si no se envía manualmente.';
COMMENT ON TRIGGER on_absence_marked ON class_participants IS 'Trigger que detecta cuando se marca una ausencia y crea una notificación WhatsApp pendiente automáticamente';
