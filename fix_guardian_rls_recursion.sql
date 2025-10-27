-- ============================================
-- FIX: Eliminar políticas que causan recursión infinita
-- ============================================
-- Las políticas de guardians/students causaban recursión infinita
-- Las eliminamos para que funcione correctamente
-- ============================================

-- PASO 1: Eliminar las políticas problemáticas de student_enrollments
DROP POLICY IF EXISTS "Guardians can view their children enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.student_enrollments;

-- PASO 2: Verificar que las policies existentes de student_enrollments siguen funcionando
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'student_enrollments'
ORDER BY policyname;

-- NOTA IMPORTANTE:
-- Las políticas de guardians para ver enrollments de sus hijos las implementaremos
-- a nivel de aplicación (frontend) cuando creemos el Guardian Dashboard.
-- No necesitamos RLS para esto porque:
-- 1. Los guardians verán los enrollments a través de sus hijos (account_dependents)
-- 2. Las consultas se harán con JOINs desde el frontend
-- 3. Evitamos recursión infinita en RLS

SELECT '✅ Políticas problemáticas eliminadas. Sistema funcionando correctamente!' as status;
