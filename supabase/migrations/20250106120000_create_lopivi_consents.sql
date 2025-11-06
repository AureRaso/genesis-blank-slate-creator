-- Create lopivi_consents table to track LOPIVI consent acceptances
CREATE TABLE IF NOT EXISTS lopivi_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  document_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX idx_lopivi_consents_user_id ON lopivi_consents(user_id);
CREATE INDEX idx_lopivi_consents_consent_date ON lopivi_consents(consent_date);

-- Add RLS policies
ALTER TABLE lopivi_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view their own consents"
  ON lopivi_consents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own consents
CREATE POLICY "Users can insert their own consents"
  ON lopivi_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all consents
CREATE POLICY "Admins can view all consents"
  ON lopivi_consents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comment on table
COMMENT ON TABLE lopivi_consents IS 'Stores user consents for LOPIVI (Ley Orgánica de Protección Integral a la Infancia y la Adolescencia frente a la Violencia)';
