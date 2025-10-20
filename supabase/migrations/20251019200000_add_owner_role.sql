-- ============================================
-- Migración: Agregar rol 'owner' al sistema
-- ============================================
-- IMPORTANTE: Esta migración SOLO AGREGA, no modifica nada existente
-- No afecta a usuarios, políticas o funcionalidad actual
-- ============================================

-- Paso 1: Modificar el check constraint para incluir 'owner'
-- NOTA: Esto solo permite el valor, no cambia ningún dato existente
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('player', 'trainer', 'admin', 'club_admin', 'owner'));

-- Paso 2: Crear función helper para verificar si un usuario es owner
-- NOTA: Esta es una función NUEVA, no modifica ninguna existente
CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 3: Crear función para convertir un admin en owner (solo para uso manual)
-- NOTA: Esta es una función NUEVA que NO se ejecuta automáticamente
CREATE OR REPLACE FUNCTION public.promote_to_owner(target_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Solo permite promover a admins existentes
  UPDATE public.profiles
  SET role = 'owner'
  WHERE email = target_email
  AND role = 'admin'; -- Solo si ya es admin

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found or is not an admin', target_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICACIÓN: Consultas para confirmar que todo está bien
-- ============================================

-- Ver el constraint actualizado
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'profiles_role_check';

-- Verificar que NO hay usuarios con rol 'owner' todavía
SELECT COUNT(*) as owner_count
FROM public.profiles
WHERE role = 'owner';

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Esta migración NO cambia ningún rol existente
-- 2. Para promover un usuario a owner, ejecuta manualmente:
--    SELECT promote_to_owner('email@del.admin');
-- 3. Los usuarios existentes (players, trainers, admins) NO se ven afectados
-- 4. Las políticas RLS existentes siguen funcionando igual
-- ============================================
