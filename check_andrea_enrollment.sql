-- Verificar si Andrea tiene registro en student_enrollments
SELECT * FROM student_enrollments
WHERE email = 'andrearayacoaching@gmail.com';

-- Ver el perfil de Andrea
SELECT * FROM profiles
WHERE id = '55a58f7a-a2d4-407f-b499-f7082889102d';

-- Ver si hay algún enrollment para el club Hesperides
SELECT se.*, p.full_name, p.email
FROM student_enrollments se
LEFT JOIN profiles p ON p.id = se.profile_id
WHERE se.club_id = '7b6f49ae-d496-407b-bca1-f5f1e9370610';
