-- Primero, obtener el ID de un entrenador del club Hesperides
-- Si no hay entrenador, usar el ID del admin que creó el club

-- PASO 1: Verificar entrenadores del club Hesperides
SELECT tc.trainer_profile_id, p.full_name, p.email
FROM trainer_clubs tc
JOIN profiles p ON p.id = tc.trainer_profile_id
WHERE tc.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- PASO 2: Si no hay entrenador, obtener el admin del club
SELECT created_by_profile_id, p.full_name, p.email
FROM clubs c
JOIN profiles p ON p.id = c.created_by_profile_id
WHERE c.id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';

-- PASO 3: Crear el enrollment para Andrea
-- IMPORTANTE: Reemplaza 'TRAINER_OR_ADMIN_ID' con el ID obtenido en PASO 1 o PASO 2

INSERT INTO student_enrollments (
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
  'TRAINER_OR_ADMIN_ID',  -- Reemplazar con ID real
  '7b6f49ae-d496-407b-bca1-f5f1e9370610',  -- Club Hesperides
  'TRAINER_OR_ADMIN_ID',  -- Reemplazar con ID real (mismo que arriba)
  'Andrea Raya Domínguez',
  'andrearayacoaching@gmail.com',
  '',  -- Phone vacío si no lo tienes
  1.0,  -- Level como decimal
  ARRAY[]::text[],  -- weekly_days vacío
  ARRAY[]::text[],  -- preferred_times vacío
  'mensual',
  'active',
  NOW(),
  NOW()
);

-- PASO 4: Verificar que se creó correctamente
SELECT * FROM student_enrollments
WHERE email = 'andrearayacoaching@gmail.com';
