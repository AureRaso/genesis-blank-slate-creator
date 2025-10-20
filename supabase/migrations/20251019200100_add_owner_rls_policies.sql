-- ============================================
-- Migración: Políticas RLS para rol 'owner'
-- ============================================
-- IMPORTANTE: Estas políticas son NUEVAS y solo afectan a owners
-- NO modifican ninguna política existente
-- Los usuarios actuales (players, trainers, admins) no se ven afectados
-- ============================================

-- ============================================
-- POLÍTICAS PARA TABLA: profiles
-- ============================================

-- Owners pueden VER todos los perfiles
CREATE POLICY "Owners can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Solo si el usuario autenticado es owner
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================
-- POLÍTICAS PARA TABLA: clubs
-- ============================================

-- Owners pueden VER todos los clubs
CREATE POLICY "Owners can view all clubs"
ON public.clubs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================
-- POLÍTICAS PARA TABLA: student_enrollments
-- ============================================

-- Owners pueden VER todos los enrollments
CREATE POLICY "Owners can view all student enrollments"
ON public.student_enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================
-- POLÍTICAS PARA TABLA: programmed_classes
-- ============================================

-- Owners pueden VER todas las clases
CREATE POLICY "Owners can view all programmed classes"
ON public.programmed_classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================
-- POLÍTICAS PARA TABLA: class_participants
-- ============================================

-- Owners pueden VER todos los participantes
CREATE POLICY "Owners can view all class participants"
ON public.class_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================
-- POLÍTICAS PARA TABLA: payment_records
-- ============================================

-- Owners pueden VER todos los pagos
CREATE POLICY "Owners can view all payment records"
ON public.payment_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================
-- POLÍTICAS PARA TABLA: leagues
-- ============================================

-- Owners pueden VER todas las ligas
CREATE POLICY "Owners can view all leagues"
ON public.leagues
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================
-- VERIFICACIÓN: Ver todas las políticas de owner creadas
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE '%wner%'
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Estas políticas SOLO dan acceso SELECT (lectura) a owners
-- 2. NO dan permisos de INSERT, UPDATE o DELETE (por seguridad)
-- 3. Las políticas existentes para otros roles NO se modifican
-- 4. Estas políticas solo se activan si el usuario tiene role = 'owner'
-- 5. Como aún no hay usuarios owner, estas políticas no afectan a nadie
-- ============================================
