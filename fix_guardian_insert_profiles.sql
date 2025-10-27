-- ============================================
-- FIX: Permitir a guardians crear perfiles de hijos
-- ============================================
-- Los guardians necesitan poder insertar en la tabla profiles
-- para crear perfiles de sus hijos
-- ============================================

-- PASO 1: Crear policy para que guardians puedan insertar perfiles de tipo 'player'
DROP POLICY IF EXISTS "Guardians can create player profiles for their children" ON public.profiles;

CREATE POLICY "Guardians can create player profiles for their children"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Solo si el usuario autenticado es un guardian
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'guardian'
  )
  -- Y el perfil que está creando es de tipo 'player'
  AND role = 'player'
  -- Y el club del hijo es el mismo que el del guardian
  AND club_id = (
    SELECT club_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- PASO 2: Verificar las policies existentes de profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

SELECT '✅ Policy creada! Los guardians ahora pueden crear perfiles de hijos.' as status;
