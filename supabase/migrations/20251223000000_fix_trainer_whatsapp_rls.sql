-- FIX-2025-12-23: Permitir a trainers ver grupos de WhatsApp de su club
-- Problema: La política RLS solo buscaba en trainer_clubs, pero el hook también usa profile.club_id
-- Solución: Modificar la política existente para incluir profile.club_id

-- Modificar la política existente
ALTER POLICY "Trainers can view their club whatsapp groups"
ON whatsapp_groups
USING (
  -- Opción 1: El grupo está asignado directamente al trainer
  trainer_profile_id = auth.uid()
  OR
  -- Opción 2: El grupo pertenece a un club en trainer_clubs
  club_id IN (
    SELECT trainer_clubs.club_id
    FROM trainer_clubs
    WHERE trainer_clubs.trainer_profile_id = auth.uid()
  )
  OR
  -- Opción 3: El grupo pertenece al club del perfil del trainer (NUEVO)
  club_id IN (
    SELECT profiles.club_id
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
      AND profiles.club_id IS NOT NULL
  )
);
