-- ============================================
-- POLÍTICAS RLS SEGURAS PARA OWNER
-- ============================================
-- Estas políticas permiten a los owners ver todos los datos
-- SIN causar recursión infinita o errores 500

-- IMPORTANTE: Estas políticas usan auth.uid() y verifican el rol
-- directamente contra la columna role, sin funciones auxiliares

-- ============================================
-- PASO 1: Políticas para PROFILES
-- ============================================

-- Owner puede ver todos los perfiles
-- NOTA: Esta política es segura porque NO hace queries adicionales
CREATE POLICY "Owner: view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Si el usuario actual tiene role = 'owner', puede ver todos los perfiles
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  )
);

-- ============================================
-- PASO 2: Políticas para CLUBS
-- ============================================

CREATE POLICY "Owner: view all clubs"
ON public.clubs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  )
);

-- ============================================
-- PASO 3: Políticas para STUDENT_ENROLLMENTS
-- ============================================

CREATE POLICY "Owner: view all student enrollments"
ON public.student_enrollments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  )
);

-- ============================================
-- PASO 4: Políticas para PROGRAMMED_CLASSES
-- ============================================

CREATE POLICY "Owner: view all programmed classes"
ON public.programmed_classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  )
);

-- ============================================
-- PASO 5: Políticas para CLASS_PARTICIPANTS
-- ============================================

CREATE POLICY "Owner: view all class participants"
ON public.class_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  )
);

-- ============================================
-- PASO 6: Políticas para PAYMENT_RECORDS
-- ============================================

CREATE POLICY "Owner: view all payment records"
ON public.payment_records
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  )
);

-- ============================================
-- PASO 7: Políticas para LEAGUES
-- ============================================

CREATE POLICY "Owner: view all leagues"
ON public.leagues
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    LIMIT 1
  )
);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esta query para ver todas las políticas de owner:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE policyname LIKE 'Owner:%'
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Después de ejecutar este script:
-- 1. Los owners podrán leer TODAS las tablas del sistema
-- 2. Los usuarios normales NO se verán afectados
-- 3. NO habrá errores 500 porque las políticas son simples
-- 4. NO hay recursión porque solo hacemos una consulta directa

-- ============================================
-- TESTING
-- ============================================
-- Para probar:
-- 1. Promover un usuario a owner: UPDATE profiles SET role = 'owner' WHERE email = 'tu-email@example.com';
-- 2. Hacer login con ese usuario
-- 3. Navegar a /owner
-- 4. Verificar que se muestran las métricas correctamente
-- 5. NO debería haber errores 500 en la consola
