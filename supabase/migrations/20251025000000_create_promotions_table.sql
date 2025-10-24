-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  description text,
  discount_code text NOT NULL,
  link text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Add index for faster club lookups
CREATE INDEX IF NOT EXISTS promotions_club_id_idx ON promotions(club_id);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions

-- Admin and Owner can see all promotions
CREATE POLICY "Admins and owners can view all promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- Trainers can see promotions for their clubs
CREATE POLICY "Trainers can view promotions for their clubs"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'trainer'
      AND profiles.club_id = promotions.club_id
    )
  );

-- Players and guardians can see promotions for their clubs
CREATE POLICY "Players and guardians can view promotions for their clubs"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('player', 'guardian')
      AND profiles.club_id = promotions.club_id
    )
  );

-- Only admins can insert promotions
CREATE POLICY "Only admins can insert promotions"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update promotions
CREATE POLICY "Only admins can update promotions"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete promotions
CREATE POLICY "Only admins can delete promotions"
  ON promotions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();
