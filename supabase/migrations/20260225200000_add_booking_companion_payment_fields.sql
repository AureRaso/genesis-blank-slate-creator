-- =====================================================
-- Add companion_details, payment_method, student_bono_id
-- to private_lesson_bookings for the player booking flow
-- =====================================================

ALTER TABLE private_lesson_bookings
  ADD COLUMN IF NOT EXISTS companion_details JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) CHECK (payment_method IN ('academia', 'bono')),
  ADD COLUMN IF NOT EXISTS student_bono_id UUID REFERENCES student_bonos(id);

COMMENT ON COLUMN private_lesson_bookings.companion_details IS
  'JSON array of companion info: [{name, email?, type: "registered"|"manual", enrollment_id?}]';
COMMENT ON COLUMN private_lesson_bookings.payment_method IS
  'Payment method: academia (pay at club) or bono (use class pack)';
COMMENT ON COLUMN private_lesson_bookings.student_bono_id IS
  'Reference to student_bonos if paying with a bono (deducted on trainer confirm)';