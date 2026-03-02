-- Allow players to cancel their own bookings that are pending OR confirmed
-- Previously only "pending" was allowed, but players need to cancel confirmed
-- bookings too (up to 24h before the class, enforced in the frontend).

DROP POLICY IF EXISTS "Players cancel own pending bookings" ON private_lesson_bookings;

CREATE POLICY "Players cancel own bookings"
  ON private_lesson_bookings FOR UPDATE
  USING (booked_by_profile_id = auth.uid() AND status IN ('pending', 'confirmed'));
