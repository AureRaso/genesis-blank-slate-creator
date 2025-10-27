-- ============================================
-- EMERGENCIA: ELIMINAR TODAS LAS POLÍTICAS DE OWNER
-- ============================================
-- Esto restaurará el funcionamiento normal del sistema

-- Eliminar TODAS las políticas que creamos para owner
DROP POLICY IF EXISTS "Owner: view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner: view all clubs" ON public.clubs;
DROP POLICY IF EXISTS "Owner: view all student enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Owner: view all programmed classes" ON public.programmed_classes;
DROP POLICY IF EXISTS "Owner: view all class participants" ON public.class_participants;
DROP POLICY IF EXISTS "Owner: view all payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Owner: view all leagues" ON public.leagues;

-- También eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all clubs" ON public.clubs;
DROP POLICY IF EXISTS "Owners can view all student enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Owners can view all programmed classes" ON public.programmed_classes;
DROP POLICY IF EXISTS "Owners can view all class participants" ON public.class_participants;
DROP POLICY IF EXISTS "Owners can view all payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Owners can view all leagues" ON public.leagues;

-- Verificar que se eliminaron
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE policyname LIKE '%Owner%' OR policyname LIKE '%owner%'
ORDER BY tablename, policyname;

-- El resultado debe estar vacío
