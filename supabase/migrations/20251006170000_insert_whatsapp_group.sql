-- Insert WhatsApp group for PadelDinamic & padelock
-- This group is associated with Iron X Deluxe club and Iron Trainer 3

INSERT INTO whatsapp_groups (
  group_chat_id,
  group_name,
  is_active,
  club_id,
  trainer_profile_id
)
VALUES (
  '120363421038303047@g.us',
  'PadelDinamic & padelock',
  true,
  '81ba7ba9-dbbd-4e58-a34d-dc13c881c3f9', -- Iron X Deluxe club_id
  'bd464755-a2ea-4759-90fb-e562b6f28884'  -- Iron Trainer 3 profile_id
)
ON CONFLICT (group_chat_id)
DO UPDATE SET
  group_name = EXCLUDED.group_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
