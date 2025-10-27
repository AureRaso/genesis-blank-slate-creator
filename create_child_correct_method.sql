-- ========================================
-- MÉTODO CORRECTO: Crear hijo usando Admin API
-- ========================================
-- Como profiles.id tiene FK a auth.users, necesitamos crear el usuario primero
-- Esto debe hacerse desde el Dashboard de Supabase
-- ========================================

-- OPCIÓN 1: Usar el Dashboard de Supabase (RECOMENDADO)
-- ========================================
-- 1. Ve a: Authentication → Users → Add user (botón verde)
-- 2. Rellena:
--    Email: child.antonio.duran.1732280715@temp.padelock.com
--    Password: TempPass123! (temporal, no importa)
--    ✅ Auto Confirm User: MARCAR ESTA CASILLA
--    Email Confirm: YES
--
-- 3. En "User Metadata" (abajo), añade:
--    {
--      "full_name": "Antonio Nocete Durán",
--      "club_id": "7b6f49ae-d496-407b-bca1-f5f1e9370610",
--      "level": 3.0,
--      "role": "player"
--    }
--
-- 4. Clic en "Create user"
-- 5. El trigger handle_new_user creará automáticamente el perfil
-- 6. Copia el UUID del usuario creado
-- 7. Ve al paso siguiente para crear la relación

-- ========================================
-- PASO 2: Crear la relación (después de crear el usuario)
-- ========================================
-- Reemplaza <CHILD_USER_ID> con el UUID del usuario creado en el paso 1

/*
INSERT INTO account_dependents (
  guardian_profile_id,
  dependent_profile_id,
  relationship_type,
  birth_date
)
VALUES (
  'a1dce7a0-2b7d-4651-89f7-4157cdeb152e',  -- Antonio (guardian)
  '<CHILD_USER_ID>',  -- UUID del hijo creado
  'child',
  '2015-01-01'::date
);
*/

-- ========================================
-- PASO 3: Verificar que todo se creó correctamente
-- ========================================
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.level,
  p.club_id,
  ad.relationship_type,
  EXTRACT(YEAR FROM age(ad.birth_date)) as edad
FROM profiles p
INNER JOIN account_dependents ad ON ad.dependent_profile_id = p.id
WHERE ad.guardian_profile_id = 'a1dce7a0-2b7d-4651-89f7-4157cdeb152e';

-- ========================================
-- OPCIÓN 2 (ALTERNATIVA): Usar SQL con función admin
-- ========================================
-- Si tienes acceso a la función admin de Supabase:
-- Esta es una función de Supabase que permite crear usuarios via SQL

/*
SELECT auth.create_user(
  jsonb_build_object(
    'email', 'child.antonio.duran.' || extract(epoch from now())::bigint || '@temp.padelock.com',
    'password', 'TempPass123!',
    'email_confirm', true,
    'user_metadata', jsonb_build_object(
      'full_name', 'Antonio Nocete Durán',
      'club_id', '7b6f49ae-d496-407b-bca1-f5f1e9370610',
      'level', 3.0,
      'role', 'player'
    )
  )
);
*/
