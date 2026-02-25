-- Add private lesson pricing fields to trainers table
-- Admin defines 4 per-person prices (based on group size 1-4 players)
-- and a default class duration for each trainer

ALTER TABLE trainers
  ADD COLUMN IF NOT EXISTS price_1_player NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_2_players NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_3_players NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_4_players NUMERIC(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS class_duration_minutes INTEGER DEFAULT 60;

COMMENT ON COLUMN trainers.price_1_player IS 'Price per person when 1 player books a private class';
COMMENT ON COLUMN trainers.price_2_players IS 'Price per person when 2 players book a private class';
COMMENT ON COLUMN trainers.price_3_players IS 'Price per person when 3 players book a private class';
COMMENT ON COLUMN trainers.price_4_players IS 'Price per person when 4 players book a private class';
COMMENT ON COLUMN trainers.class_duration_minutes IS 'Default duration in minutes for private lessons';