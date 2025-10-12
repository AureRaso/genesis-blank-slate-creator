-- Create enrollment for ironxplayer@gmail.com
INSERT INTO public.student_enrollments (
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
  enrollment_date
) VALUES (
  'bd464755-a2ea-4759-90fb-e562b6f28884', -- Iron Trainer 3
  '81ba7ba9-dbbd-4e58-a34d-dc13c881c3f9', -- Iron X club
  '705cfcd4-84ef-4d88-9a63-366747621858', -- Iván Iron (admin)
  'TestNoti',
  'ironxplayer@gmail.com',
  '000000000', -- Phone placeholder
  4.0, -- Level
  ARRAY['martes'], -- Weekly days
  ARRAY['16:30'], -- Preferred times
  'mensual', -- Enrollment period
  'active', -- Status
  CURRENT_DATE -- Enrollment date
);
