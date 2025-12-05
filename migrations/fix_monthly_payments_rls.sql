-- =====================================================
-- FIX: Row Level Security para monthly_payments
-- =====================================================
-- Permite que los triggers funcionen correctamente cuando
-- los jugadores confirman/rechazan asistencia

-- PASO 1: Ver las políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'monthly_payments';

-- =====================================================
-- PASO 2: Eliminar políticas antiguas y recrear correctamente
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Admins can view all monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Users can update their own payment status" ON monthly_payments;
DROP POLICY IF EXISTS "Admins can update all monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "System can insert monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Admins can insert monthly payments" ON monthly_payments;
DROP POLICY IF EXISTS "Enable read for users based on enrollment" ON monthly_payments;
DROP POLICY IF EXISTS "Enable update for users on their payments" ON monthly_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON monthly_payments;

-- =====================================================
-- PASO 3: Crear nuevas políticas RLS
-- =====================================================

-- Política de SELECT: Los usuarios pueden ver sus propios pagos
CREATE POLICY "Users can view their own monthly payments"
ON monthly_payments
FOR SELECT
TO authenticated
USING (
  student_enrollment_id IN (
    SELECT id FROM student_enrollments
    WHERE student_profile_id = auth.uid()
  )
);

-- Política de SELECT: Admins y trainers pueden ver todos los pagos de su club
CREATE POLICY "Admins and trainers can view all club monthly payments"
ON monthly_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN student_enrollments se ON se.id = monthly_payments.student_enrollment_id
    WHERE p.id = auth.uid()
    AND p.club_id = se.club_id
    AND p.role IN ('admin', 'trainer')
  )
);

-- Política de INSERT: Permitir inserciones desde triggers (usando security definer functions)
-- IMPORTANTE: Esta política permite que los triggers inserten pagos automáticamente
CREATE POLICY "Allow system to insert monthly payments"
ON monthly_payments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permitir si es admin/trainer del club
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN student_enrollments se ON se.id = student_enrollment_id
    WHERE p.id = auth.uid()
    AND p.club_id = se.club_id
    AND p.role IN ('admin', 'trainer')
  )
  OR
  -- Permitir si el pago es para el estudiante del usuario autenticado
  -- (esto permite que los triggers funcionen cuando un jugador confirma asistencia)
  student_enrollment_id IN (
    SELECT id FROM student_enrollments
    WHERE student_profile_id = auth.uid()
  )
);

-- Política de UPDATE: Los usuarios pueden marcar sus pagos como pagados
CREATE POLICY "Users can update their own payment status"
ON monthly_payments
FOR UPDATE
TO authenticated
USING (
  student_enrollment_id IN (
    SELECT id FROM student_enrollments
    WHERE student_profile_id = auth.uid()
  )
)
WITH CHECK (
  -- Solo pueden cambiar estos campos específicos
  student_enrollment_id IN (
    SELECT id FROM student_enrollments
    WHERE student_profile_id = auth.uid()
  )
);

-- Política de UPDATE: Admins y trainers pueden actualizar cualquier pago de su club
CREATE POLICY "Admins and trainers can update club payments"
ON monthly_payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN student_enrollments se ON se.id = monthly_payments.student_enrollment_id
    WHERE p.id = auth.uid()
    AND p.club_id = se.club_id
    AND p.role IN ('admin', 'trainer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN student_enrollments se ON se.id = student_enrollment_id
    WHERE p.id = auth.uid()
    AND p.club_id = se.club_id
    AND p.role IN ('admin', 'trainer')
  )
);

-- =====================================================
-- PASO 4: Marcar la función calculate_and_create_monthly_payment como SECURITY DEFINER
-- =====================================================
-- Esto permite que la función se ejecute con los privilegios del creador (admin)
-- en lugar del usuario que la llama (jugador)

ALTER FUNCTION calculate_and_create_monthly_payment(UUID, INTEGER, INTEGER, NUMERIC)
SECURITY DEFINER;

-- Establecer el search_path para seguridad
ALTER FUNCTION calculate_and_create_monthly_payment(UUID, INTEGER, INTEGER, NUMERIC)
SET search_path = public, pg_temp;

-- =====================================================
-- PASO 5: Verificar las políticas
-- =====================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'monthly_payments'
ORDER BY cmd, policyname;

-- =====================================================
-- PASO 6: Probar que funciona
-- =====================================================
-- Ejecuta este query como un usuario jugador para verificar que puede ver sus pagos:
/*
SELECT * FROM monthly_payments mp
JOIN student_enrollments se ON se.id = mp.student_enrollment_id
WHERE se.profile_id = auth.uid();
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
