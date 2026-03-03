-- Allow all authenticated users (players, trainers, etc.) to read trainer_clubs
-- for their own club. Previously only admins/owners could read this table,
-- which meant players couldn't discover trainers for private lesson booking.

CREATE POLICY "authenticated_read_own_club_trainer_clubs"
  ON trainer_clubs FOR SELECT
  TO authenticated
  USING (
    club_id IN (
      SELECT p.club_id FROM profiles p WHERE p.id = auth.uid()
    )
  );
