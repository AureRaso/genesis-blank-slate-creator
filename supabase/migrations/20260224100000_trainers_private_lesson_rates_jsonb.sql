-- Replace individual price columns with a JSONB column that stores
-- per-duration rates: { "60": { price_1_player, price_2_players, ... }, "90": {...}, "120": {...} }

-- 1. Add new JSONB column
ALTER TABLE trainers
  ADD COLUMN IF NOT EXISTS private_lesson_rates JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing data into the JSONB structure
UPDATE trainers
SET private_lesson_rates = jsonb_build_object(
  COALESCE(class_duration_minutes, 60)::text,
  jsonb_build_object(
    'price_1_player', price_1_player,
    'price_2_players', price_2_players,
    'price_3_players', price_3_players,
    'price_4_players', price_4_players
  )
)
WHERE price_1_player IS NOT NULL
   OR price_2_players IS NOT NULL
   OR price_3_players IS NOT NULL
   OR price_4_players IS NOT NULL;

-- 3. Drop old columns
ALTER TABLE trainers
  DROP COLUMN IF EXISTS price_1_player,
  DROP COLUMN IF EXISTS price_2_players,
  DROP COLUMN IF EXISTS price_3_players,
  DROP COLUMN IF EXISTS price_4_players,
  DROP COLUMN IF EXISTS class_duration_minutes;
