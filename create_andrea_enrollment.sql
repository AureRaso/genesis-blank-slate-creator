-- Primero, obtener el trainer_profile_id del entrenador del club Hesperides
-- Asumiendo que hay un entrenador asignado, si no, usaremos el admin

-- Opción 1: Obtener el primer entrenador del club
SELECT trainer_profile_id
FROM trainer_clubs
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
LIMIT 1;

-- Opción 2: Si no hay entrenador, obtener el admin del club
SELECT created_by_profile_id
FROM clubs
WHERE id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- Crear el enrollment para Andrea
-- NOTA: Reemplaza 'TRAINER_ID_AQUI' con el ID del entrenador o admin obtenido arriba

INSERT INTO student_enrollments (
  profile_id,
  trainer_profile_id,
  club_id,
  created_by_profile_id,
  full_name,
  email,
  phone,
  level,
  weekly_days,
  preferred_times,
  enrollment_period,
  status,
  created_at,
  updated_at
)
VALUES (
  '55a58f7a-a2d4-407f-b499-f7082889102d',  -- Andrea's profile_id
  'TRAINER_ID_AQUI',  -- Reemplazar con el trainer_profile_id
  '7b6f49ae-d496-407b-bca1-f5f1e9370610',  -- Club Hesperides
  'TRAINER_ID_AQUI',  -- Reemplazar con el mismo trainer_profile_id
  'Andrea Raya Domínguez',
  'andrearayacoaching@gmail.com',
  '',  -- Phone (vacío si no lo tienes)
  1,   -- Level
  ARRAY[]::text[],  -- weekly_days vacío
  ARRAY[]::text[],  -- preferred_times vacío
  'mensual',
  'active',
  NOW(),
  NOW()
);
