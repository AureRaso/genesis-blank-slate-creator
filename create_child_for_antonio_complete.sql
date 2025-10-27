-- ========================================
-- CREAR HIJO MANUALMENTE PARA ANTONIO NOCETE
-- ========================================
-- Guardian: Antonio Nocete Conde
-- Guardian ID: a1dce7a0-2b7d-4651-89f7-4157cdeb152e
-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610 (Hespérides)
-- ========================================

-- IMPORTANTE: Este proceso crea un hijo SIN usar la autenticación normal
-- El hijo NO podrá iniciar sesión (no tiene contraseña real)
-- Solo sirve para que el guardian pueda inscribirlo en clases

-- ========================================
-- PASO 1: Crear el usuario en auth.users
-- ========================================
-- NOTA: Esto debe ejecutarse desde el Dashboard de Supabase
-- Ve a: Authentication → Users → Add user

-- Email: child.hijo.antonio.[TIMESTAMP]@temp.padelock.com
-- Password: [Genera una contraseña temporal aleatoria]
-- Auto Confirm User: YES (marcar esta casilla)

-- O usa este método alternativo si tienes acceso al SQL:
-- IMPORTANTE: Supabase no permite crear usuarios directamente via SQL
-- Debes usar el Admin API o el Dashboard

-- ========================================
-- PASO 2 (ALTERNATIVO): Crear directamente el perfil
-- ========================================
-- Si puedes obtener el user_id después de crear el usuario,
-- el trigger handle_new_user debería crear el perfil automáticamente

-- Pero si no se crea, ejecuta esto (reemplaza <USER_ID>):
/*
INSERT INTO profiles (
  id,
  full_name,
  email,
  role,
  club_id,
  level,
  created_at,
  updated_at
)
VALUES (
  '<USER_ID>',  -- ID del usuario creado en auth.users
  'Hijo de Antonio',  -- Nombre del hijo
  'child.hijo.antonio.' || extract(epoch from now())::bigint || '@temp.padelock.com',
  'player',
  '7b6f49ae-d496-407b-bca1-f5f1e9370610',  -- Club Hespérides
  3.0,  -- Nivel por defecto
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
*/

-- ========================================
-- PASO 3: Crear la relación en account_dependents
-- ========================================
-- Ejecuta esto DESPUÉS de crear el perfil
-- Reemplaza <CHILD_USER_ID> con el ID real del hijo

/*
INSERT INTO account_dependents (
  guardian_profile_id,
  dependent_profile_id,
  relationship_type,
  birth_date
)
VALUES (
  'a1dce7a0-2b7d-4651-89f7-4157cdeb152e',  -- Antonio (guardian)
  '<CHILD_USER_ID>',  -- ID del hijo creado
  'child',
  NULL
)
ON CONFLICT DO NOTHING;
*/

-- ========================================
-- PASO 4: Verificar que todo se creó correctamente
-- ========================================
SELECT
  'Guardian Info' as type,
  g.id,
  g.full_name as name,
  g.email,
  g.role,
  NULL as relationship_type
FROM profiles g
WHERE g.id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'

UNION ALL

SELECT
  'Child Info' as type,
  p.id,
  p.full_name as name,
  p.email,
  p.role,
  ad.relationship_type
FROM account_dependents ad
LEFT JOIN profiles p ON p.id = ad.dependent_profile_id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e'
ORDER BY type DESC;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- Deberías ver 2 filas:
-- 1. Guardian Info - Antonio Nocete Conde (guardian)
-- 2. Child Info - Hijo de Antonio (player) con relationship_type = 'child'
