-- Verificar que la política RLS se actualizó correctamente
SELECT 
  '1. POLÍTICA RLS ACTUALIZADA' as seccion,
  policyname,
  qual
FROM pg_policies
WHERE tablename = 'whatsapp_groups'
  AND policyname = 'Trainers can view their club whatsapp groups';

-- Simular acceso del trainer al grupo (como si fuera el hook)
-- Nota: Este query simula lo que vería el trainer con RLS activo
WITH trainer_groups AS (
  SELECT 
    wg.id,
    wg.group_name,
    wg.group_chat_id,
    wg.is_active,
    wg.club_id,
    wg.trainer_profile_id,
    CASE 
      WHEN wg.trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865' 
        THEN 'Asignado directamente al trainer'
      WHEN wg.club_id IN (
        SELECT club_id FROM trainer_clubs 
        WHERE trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865'
      ) THEN 'Por trainer_clubs'
      WHEN wg.club_id IN (
        SELECT club_id FROM profiles 
        WHERE id = '16912a96-8d86-452e-93f7-bece83863865'
          AND role = 'trainer'
          AND club_id IS NOT NULL
      ) THEN 'Por profile.club_id (NUEVO)'
      ELSE 'NO DEBERÍA VER ESTO'
    END as motivo_acceso
  FROM whatsapp_groups wg
  WHERE wg.is_active = true
    AND (
      -- Replica la lógica de la política RLS
      wg.trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865'
      OR
      wg.club_id IN (
        SELECT club_id FROM trainer_clubs 
        WHERE trainer_profile_id = '16912a96-8d86-452e-93f7-bece83863865'
      )
      OR
      wg.club_id IN (
        SELECT club_id FROM profiles 
        WHERE id = '16912a96-8d86-452e-93f7-bece83863865'
          AND role = 'trainer'
          AND club_id IS NOT NULL
      )
    )
)
SELECT 
  '2. GRUPOS QUE EL TRAINER PUEDE VER' as seccion,
  group_name,
  group_chat_id,
  motivo_acceso
FROM trainer_groups;
