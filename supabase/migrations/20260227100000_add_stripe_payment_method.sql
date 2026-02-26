-- Add 'stripe' to payment_method CHECK constraint on private_lesson_bookings
ALTER TABLE private_lesson_bookings
  DROP CONSTRAINT IF EXISTS private_lesson_bookings_payment_method_check;

ALTER TABLE private_lesson_bookings
  ADD CONSTRAINT private_lesson_bookings_payment_method_check
  CHECK (payment_method IN ('academia', 'bono', 'stripe'));
