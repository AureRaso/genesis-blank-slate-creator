-- Investigar mensajes fallidos del 14 de enero 2026

-- Caso 1: Micaela Screpanti (Hespérides Padel)
SELECT
  se.id as enrollment_id,
  se.full_name,
  se.email,
  se.phone,
  se.club_id,
  c.name as club_name
FROM student_enrollments se
JOIN clubs c ON se.club_id = c.id
WHERE se.full_name ILIKE '%Micaela%Screpanti%'
   OR se.phone LIKE '%3711653550%';

-- Caso 2: Fatima Balda Constantin (La Red 21 Galisport)
SELECT
  se.id as enrollment_id,
  se.full_name,
  se.email,
  se.phone,
  se.club_id,
  c.name as club_name
FROM student_enrollments se
JOIN clubs c ON se.club_id = c.id
WHERE se.full_name ILIKE '%Fatima%Balda%'
   OR se.phone LIKE '%646721508%';
