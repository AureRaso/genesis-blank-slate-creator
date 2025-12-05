-- Debug query to see what data exists for mark@gmail.com
-- Run this in Supabase SQL Editor to understand why metrics are showing 0

-- First, find mark's student_enrollment_id
SELECT
  se.id as student_enrollment_id,
  se.email,
  se.full_name,
  se.club_id,
  c.name as club_name
FROM student_enrollments se
LEFT JOIN clubs c ON se.club_id = c.id
WHERE se.email = 'mark@gmail.com';

-- Then check all class_participants records for mark
SELECT
  cp.id,
  cp.student_enrollment_id,
  cp.class_id,
  cp.status,
  cp.attendance_confirmed_for_date,
  cp.absence_confirmed,
  cp.absence_confirmed_at,
  cp.absence_reason,
  se.email,
  se.full_name,
  pc.name as class_name
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
LEFT JOIN programmed_classes pc ON cp.class_id = pc.id
WHERE se.email = 'mark@gmail.com'
ORDER BY cp.attendance_confirmed_for_date DESC NULLS LAST;

-- Check if there are any records without the 'active' status filter
SELECT
  cp.status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE cp.attendance_confirmed_for_date IS NOT NULL) as attended_count,
  COUNT(*) FILTER (WHERE cp.absence_confirmed = true) as absence_count
FROM class_participants cp
JOIN student_enrollments se ON cp.student_enrollment_id = se.id
WHERE se.email = 'mark@gmail.com'
GROUP BY cp.status;

-- Check what statuses exist in class_participants generally
SELECT DISTINCT status, COUNT(*)
FROM class_participants
GROUP BY status;
