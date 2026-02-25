-- ============================================================================
-- Migration: Allow companions to view bookings they are part of
-- Companions are stored in companion_details JSONB with profile_id
-- ============================================================================

-- RLS policy: Players can view bookings where they appear as a companion
CREATE POLICY "Companions view bookings they are part of"
  ON private_lesson_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(companion_details) AS elem
      WHERE (elem ->> 'profile_id')::UUID = auth.uid()
    )
  );
