-- Script para crear enrollments faltantes para usuarios que completaron perfil con Google
-- Esto arregla usuarios como merinainfo1@gmail.com que tienen perfil pero no enrollment

-- 1. Ver jugadores que tienen perfil completo pero NO tienen enrollment
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.club_id,
  p.level,
  p.created_at
FROM profiles p
LEFT JOIN student_enrollments se ON se.profile_id = p.id
WHERE p.role = 'player'
  AND p.club_id IS NOT NULL
  AND p.level IS NOT NULL
  AND se.id IS NULL
ORDER BY p.created_at DESC;

-- 2. Crear enrollments para jugadores que faltan
-- IMPORTANTE: Esto creará enrollments para TODOS los jugadores sin enrollment
INSERT INTO student_enrollments (
  profile_id,
  email,
  full_name,
  level,
  club_id,
  status
)
SELECT
  p.id as profile_id,
  p.email,
  p.full_name,
  p.level,
  p.club_id,
  'active' as status
FROM profiles p
LEFT JOIN student_enrollments se ON se.profile_id = p.id
WHERE p.role = 'player'
  AND p.club_id IS NOT NULL
  AND p.level IS NOT NULL
  AND se.id IS NULL;

-- 3. Verificar que se crearon correctamente
SELECT
  se.id,
  se.email,
  se.full_name,
  se.level,
  se.status,
  se.club_id,
  c.name as club_name,
  se.created_at
FROM student_enrollments se
LEFT JOIN clubs c ON c.id = se.club_id
WHERE se.email = 'merinainfo1@gmail.com';

-- 4. Contar enrollments creados
SELECT COUNT(*) as enrollments_creados
FROM student_enrollments se
JOIN profiles p ON p.id = se.profile_id
WHERE p.role = 'player'
  AND se.created_at > NOW() - INTERVAL '1 minute';
