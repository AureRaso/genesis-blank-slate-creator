-- Clean up duplicate student_enrollments keeping only the oldest record
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY email, trainer_profile_id, club_id 
           ORDER BY created_at ASC
         ) as rn
  FROM student_enrollments 
  WHERE email = 'skl@gmail.com'
)
DELETE FROM student_enrollments 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);