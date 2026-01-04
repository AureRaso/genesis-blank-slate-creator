-- ============================================================================
-- MIGRACIÓN: Añadir política para permitir múltiples admins por club
-- ============================================================================
-- PROBLEMA: La política existente "club_admins_manage_all_participants" solo
--           permite al CREADOR del club modificar participantes
--
-- SOLUCIÓN: AÑADIR una nueva política (sin eliminar la existente) que permita
--           a cualquier admin con el mismo club_id gestionar participantes
-- ============================================================================
-- TABLAS AFECTADAS:
--   - class_participants (nueva política adicional)
-- ============================================================================
-- IMPACTO:
--   - NO MODIFICA políticas existentes
--   - AÑADE nueva política permisiva para admins del mismo club
--   - Las políticas RLS son OR entre sí (PERMISSIVE), así que ambas funcionan
-- ============================================================================

-- Crear nueva política ADICIONAL para admins que comparten club_id
-- (No eliminamos la existente, las políticas PERMISSIVE se combinan con OR)
CREATE POLICY "admins_same_club_manage_participants" ON class_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    JOIN programmed_classes pc ON pc.club_id = p.club_id
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
      AND pc.id = class_participants.class_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    JOIN programmed_classes pc ON pc.club_id = p.club_id
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
      AND pc.id = class_participants.class_id
  )
);

-- Agregar comentario explicativo
COMMENT ON POLICY "admins_same_club_manage_participants" ON class_participants IS
'Permite a cualquier admin/owner gestionar participantes de clases de su club (por club_id).
Complementa la política existente que solo permitía al creador del club.
Añadido 2026-01-02 para soportar múltiples admins por club.';

-- ============================================================================
-- POLÍTICA ADICIONAL: trainer_clubs - permitir a admins del mismo club
-- ============================================================================
-- PROBLEMA: La política "Admins can manage trainer clubs for their clubs" solo
--           permite al CREADOR del club ver/gestionar trainer_clubs
-- ============================================================================

-- Política para que admins con el mismo club_id puedan VER trainer_clubs
CREATE POLICY "admins_same_club_view_trainer_clubs" ON trainer_clubs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
      AND p.club_id = trainer_clubs.club_id
  )
);

-- Política para que admins con el mismo club_id puedan GESTIONAR trainer_clubs
CREATE POLICY "admins_same_club_manage_trainer_clubs" ON trainer_clubs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
      AND p.club_id = trainer_clubs.club_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'owner')
      AND p.club_id = trainer_clubs.club_id
  )
);
