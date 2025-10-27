-- Create whatsapp_groups table
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL, -- "Menores Hespérides", "Nivel Bronce Hespérides", etc.
  whatsapp_group_id TEXT, -- WhatsApp group ID from Whapi (e.g., "34XXXXXXXXX-1234567890@g.us")
  description TEXT, -- Optional description
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

-- Admins and owners can see all groups
CREATE POLICY "Admins and owners can view whatsapp groups"
  ON whatsapp_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Trainers can see groups from their clubs
CREATE POLICY "Trainers can view their club's whatsapp groups"
  ON whatsapp_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainer_clubs
      WHERE trainer_clubs.trainer_profile_id = auth.uid()
      AND trainer_clubs.club_id = whatsapp_groups.club_id
    )
  );

-- Admins and owners can insert groups
CREATE POLICY "Admins and owners can insert whatsapp groups"
  ON whatsapp_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Admins and owners can update groups
CREATE POLICY "Admins and owners can update whatsapp groups"
  ON whatsapp_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Admins and owners can delete groups
CREATE POLICY "Admins and owners can delete whatsapp groups"
  ON whatsapp_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Create index for faster queries
CREATE INDEX idx_whatsapp_groups_club_id ON whatsapp_groups(club_id);
CREATE INDEX idx_whatsapp_groups_is_active ON whatsapp_groups(is_active);

-- Insert initial groups for Hespérides club
-- Note: You'll need to replace 'HESPERIDES_CLUB_ID' with the actual UUID
INSERT INTO whatsapp_groups (club_id, group_name, description, is_active)
SELECT
  id as club_id,
  unnest(ARRAY[
    'Menores Hespérides',
    'Nivel Bronce Hespérides',
    'Nivel Plata Hespérides',
    'Nivel Oro Hespérides'
  ]) as group_name,
  unnest(ARRAY[
    'Grupo de jugadores menores',
    'Grupo de nivel bronce (principiantes)',
    'Grupo de nivel plata (intermedios)',
    'Grupo de nivel oro (avanzados)'
  ]) as description,
  true as is_active
FROM clubs
WHERE name ILIKE '%hespérides%' OR name ILIKE '%hesperides%'
LIMIT 1;

-- Verify the insert
SELECT
  wg.id,
  wg.group_name,
  wg.description,
  c.name as club_name,
  wg.is_active
FROM whatsapp_groups wg
JOIN clubs c ON c.id = wg.club_id
ORDER BY wg.group_name;
