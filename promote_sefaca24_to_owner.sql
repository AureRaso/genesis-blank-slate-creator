-- ============================================
-- PROMOVER sefaca24@gmail.com A OWNER
-- ============================================

-- PASO 1: Verificar que el usuario existe
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'sefaca24@gmail.com';

-- PASO 2: Promover a owner
UPDATE profiles
SET role = 'owner'
WHERE email = 'sefaca24@gmail.com';

-- PASO 3: Verificar que se promovió correctamente
SELECT
  id,
  email,
  full_name,
  role,
  updated_at
FROM profiles
WHERE email = 'sefaca24@gmail.com';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- El usuario sefaca24@gmail.com debería tener role = 'owner'

-- ============================================
-- PRÓXIMOS PASOS
-- ============================================
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Haz logout de la aplicación
-- 3. Haz login con sefaca24@gmail.com
-- 4. Deberías ser redirigido automáticamente a /owner
-- 5. Verás el dashboard con métricas reales:
--    - Total de clubes
--    - Total de usuarios
--    - Total de entrenadores
--    - Total de jugadores
--    - Clases programadas hoy
--    - Enrollments activos
--    - Tabla de clubes registrados
--    - Tabla de usuarios recientes
--    - Desglose de usuarios por rol

-- ============================================
-- PARA REVERTIR (si es necesario)
-- ============================================
-- UPDATE profiles SET role = 'admin' WHERE email = 'sefaca24@gmail.com';
