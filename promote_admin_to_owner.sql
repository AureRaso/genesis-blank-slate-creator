-- ============================================
-- PASO 7: TESTING - Promover Admin a Owner
-- ============================================
-- Este script te permite promover un admin existente a owner
-- para poder probar el panel de administración.

-- OPCIÓN 1: Ver todos los admins disponibles
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- OPCIÓN 2: Promover un admin específico a owner
-- Reemplaza 'admin@email.com' con el email del admin que quieres promover

-- 2.1. Verificar que el usuario existe y es admin
SELECT
  id,
  email,
  full_name,
  role
FROM profiles
WHERE email = 'admin@email.com';

-- 2.2. Promover a owner
UPDATE profiles
SET role = 'owner'
WHERE email = 'admin@email.com'
  AND role = 'admin'; -- Solo promover si actualmente es admin

-- 2.3. Verificar que se promovió correctamente
SELECT
  id,
  email,
  full_name,
  role,
  updated_at
FROM profiles
WHERE email = 'admin@email.com';

-- RESULTADO ESPERADO:
-- El usuario debería tener role = 'owner' ahora

-- ============================================
-- INSTRUCCIONES DE TESTING
-- ============================================
-- 1. Ejecuta la OPCIÓN 1 para ver qué admins tienes
-- 2. Elige un admin para promover
-- 3. Reemplaza 'admin@email.com' en las consultas 2.1, 2.2 y 2.3
-- 4. Ejecuta las consultas en orden
-- 5. Haz logout de la aplicación
-- 6. Haz login con las credenciales del admin promovido
-- 7. Deberías ser redirigido a /owner automáticamente
-- 8. Verifica que puedes ver el OwnerDashboard

-- NOTA: Para volver a convertir el owner en admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@email.com';
