-- Check Xelpadel clubs and their students
SELECT 'Clubs de Xelpadel' as info;
SELECT id, name FROM clubs WHERE name LIKE '%Xelpadel%' OR name LIKE '%xelpadel%';

SELECT 'Estudiantes por club_id' as info;
SELECT se.club_id, c.name as club_name, COUNT(*) as student_count 
FROM student_enrollments se 
LEFT JOIN clubs c ON c.id = se.club_id 
WHERE se.status \!= 'inactive' 
GROUP BY se.club_id, c.name 
ORDER BY student_count DESC 
LIMIT 10;

SELECT 'Club IDs del superadmin' as info;
SELECT ac.club_id, c.name 
FROM admin_clubs ac 
JOIN clubs c ON c.id = ac.club_id 
WHERE ac.profile_id = 'ed8bec83-dee5-44db-aa6f-adf398919b79';
