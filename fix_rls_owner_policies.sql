-- ============================================
-- FIX: Eliminar políticas de owner que causan conflicto
-- ============================================
-- Las políticas de owner están causando error 500 al cargar perfiles
-- Vamos a eliminarlas temporalmente para restaurar funcionalidad

-- PASO 1: Eliminar TODAS las políticas nuevas de owner
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all clubs" ON public.clubs;
DROP POLICY IF EXISTS "Owners can view all student enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Owners can view all programmed classes" ON public.programmed_classes;
DROP POLICY IF EXISTS "Owners can view all class participants" ON public.class_participants;
DROP POLICY IF EXISTS "Owners can view all payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Owners can view all leagues" ON public.leagues;

-- PASO 2: Verificar que las políticas existentes siguen funcionando
-- Ejecuta esta query para verificar que los usuarios normales pueden ver sus perfiles:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Después de ejecutar este script:
-- 1. Los usuarios deberían poder hacer login normalmente
-- 2. Los perfiles deberían cargarse sin error 500
-- 3. El rol 'owner' seguirá existiendo en la base de datos
-- 4. Pero NO tendrá permisos especiales todavía

-- ============================================
-- PRÓXIMO PASO
-- ============================================
-- Una vez confirmado que todo funciona:
-- 1. Crearemos políticas RLS más simples y seguras
-- 2. Las probaremos una por una antes de continuar
