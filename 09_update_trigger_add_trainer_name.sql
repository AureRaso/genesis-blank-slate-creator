-- Actualizar el trigger para incluir el nombre del profesor en class_data

DROP FUNCTION IF EXISTS create_pending_whatsapp_notification() CASCADE;

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
  v_trainer_name TEXT;
  v_today_date DATE;
BEGIN
  IF NEW.absence_confirmed = TRUE AND
     (OLD.absence_confirmed IS NULL OR OLD.absence_confirmed = FALSE) THEN

    RAISE NOTICE '🔔 Absence marked for participant %', NEW.id;

    -- Obtener información del estudiante
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

    IF v_student_level IS NULL THEN
      v_student_level := 1;
    END IF;

    -- Obtener información de la clase Y del profesor
    SELECT
      pc.id,
      pc.name,
      pc.start_time,
      pc.duration_minutes,
      pc.club_id,
      trainer.full_name as trainer_name
    INTO v_class_info
    FROM programmed_classes pc
    LEFT JOIN profiles trainer ON trainer.id = pc.trainer_profile_id
    WHERE pc.id = NEW.class_id;

    IF v_class_info IS NULL THEN
      RAISE WARNING '⚠️ Class info not found for participant %', NEW.id;
      RETURN NEW;
    END IF;

    -- Determinar grupo WhatsApp según nivel del estudiante
    SELECT id, group_name
    INTO v_target_group_id, v_target_group_name
    FROM whatsapp_groups
    WHERE club_id = v_class_info.club_id
      AND level_target = v_student_level
      AND is_active = TRUE
    LIMIT 1;

    IF v_target_group_id IS NULL THEN
      RAISE WARNING '⚠️ No WhatsApp group found for level % in club %',
        v_student_level, v_class_info.club_id;
      RETURN NEW;
    END IF;

    v_today_date := CURRENT_DATE;

    -- Insertar notificación pendiente con nombre del profesor
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
        'target_group_name', v_target_group_name,
        'trainer_name', COALESCE(v_class_info.trainer_name, 'Por confirmar')
      )
    );

    RAISE NOTICE '✅ Pending notification created with trainer: %', v_class_info.trainer_name;

  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error in create_pending_whatsapp_notification: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_absence_marked ON class_participants;

CREATE TRIGGER on_absence_marked
  AFTER UPDATE OF absence_confirmed ON class_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_pending_whatsapp_notification();

COMMENT ON FUNCTION create_pending_whatsapp_notification IS 'Crea notificaciones WhatsApp pendientes cuando se marca una ausencia. Incluye nombre del profesor y formato correcto del mensaje.';
