-- PRUEBA con solo 2 jugadores: Adrián Cazalla y alejandra martin
-- Club ID: 7b6f49ae-d496-407b-bca1-f5f1e9370610 (Hespérides Padel)

-- Actualizar en PROFILES
UPDATE profiles
SET phone = CASE full_name
  WHEN 'Adrián Cazalla Salvatierra' THEN '+34648471649'
  WHEN 'alejandra martin' THEN '+34676179732'
  ELSE phone
END
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND full_name IN ('Adrián Cazalla Salvatierra', 'alejandra martin');

-- Actualizar en STUDENT_ENROLLMENTS
UPDATE student_enrollments se
SET phone = CASE p.full_name
  WHEN 'Adrián Cazalla Salvatierra' THEN '+34648471649'
  WHEN 'alejandra martin' THEN '+34676179732'
  ELSE se.phone
END
FROM profiles p
WHERE se.student_profile_id = p.id
  AND se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND p.full_name IN ('Adrián Cazalla Salvatierra', 'alejandra martin');

-- Verificar resultado
SELECT
  'PROFILES' as tabla,
  full_name,
  phone,
  CASE
    WHEN full_name = 'Adrián Cazalla Salvatierra' AND phone = '+34648471649' THEN '✓ CORRECTO'
    WHEN full_name = 'alejandra martin' AND phone = '+34676179732' THEN '✓ CORRECTO'
    ELSE '✗ ERROR'
  END as estado
FROM profiles
WHERE club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND full_name IN ('Adrián Cazalla Salvatierra', 'alejandra martin')

UNION ALL

SELECT
  'STUDENT_ENROLLMENTS' as tabla,
  p.full_name,
  se.phone,
  CASE
    WHEN p.full_name = 'Adrián Cazalla Salvatierra' AND se.phone = '+34648471649' THEN '✓ CORRECTO'
    WHEN p.full_name = 'alejandra martin' AND se.phone = '+34676179732' THEN '✓ CORRECTO'
    ELSE '✗ ERROR'
  END as estado
FROM student_enrollments se
JOIN profiles p ON p.id = se.student_profile_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610'
  AND p.full_name IN ('Adrián Cazalla Salvatierra', 'alejandra martin')
ORDER BY tabla, full_name;
