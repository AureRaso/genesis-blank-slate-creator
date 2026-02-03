-- ============================================================================
-- MIGRACIÓN: Añadir política de superadmin para class_participants
-- ============================================================================
-- PROBLEMA: Los superadmins no pueden ver class_participants porque las
--           políticas RLS existentes solo verifican:
--           1. trainer_clubs (trainers)
--           2. clubs.created_by_profile_id (creador del club)
--           3. profiles.club_id para admin/owner
--           Los superadmins usan admin_clubs para acceder a clubs y no tienen
--           club_id en su perfil, por lo que la query devuelve 0 resultados.
--           Esto causa que weekly_hours muestre 0h para todos los alumnos
--           en la página de asignación de tarifas.
-- ============================================================================
-- SOLUCIÓN: Añadir una nueva política PERMISIVA que permita a superadmins
--           acceder a class_participants de clases de sus clubs asignados
-- ============================================================================

CREATE POLICY "superadmins_manage_class_participants" ON class_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    JOIN admin_clubs ac ON ac.admin_profile_id = p.id
    JOIN programmed_classes pc ON pc.club_id = ac.club_id
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
      AND pc.id = class_participants.class_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    JOIN admin_clubs ac ON ac.admin_profile_id = p.id
    JOIN programmed_classes pc ON pc.club_id = ac.club_id
    WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
      AND pc.id = class_participants.class_id
  )
);

COMMENT ON POLICY "superadmins_manage_class_participants" ON class_participants IS
'Permite a superadmins gestionar participantes de clases de sus clubs asignados (via admin_clubs).
Complementa las políticas existentes para trainers, owners y admins.
Añadido 2026-02-03 para corregir bug de 0h en asignación de tarifas.';
