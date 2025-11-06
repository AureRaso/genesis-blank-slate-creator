-- Create table for LOPIVI incident reports/denuncias
CREATE TABLE IF NOT EXISTS lopivi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  reporter_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  reporter_phone TEXT,
  reporter_relationship TEXT NOT NULL, -- Padre/madre, tutor, alumno, testigo, etc.

  incident_type TEXT NOT NULL, -- Tipo de incidente
  incident_date DATE,
  incident_description TEXT NOT NULL,
  people_involved TEXT, -- Personas involucradas
  witnesses TEXT, -- Testigos

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_lopivi_reports_club_id ON lopivi_reports(club_id);
CREATE INDEX idx_lopivi_reports_reporter_profile_id ON lopivi_reports(reporter_profile_id);
CREATE INDEX idx_lopivi_reports_status ON lopivi_reports(status);
CREATE INDEX idx_lopivi_reports_created_at ON lopivi_reports(created_at);

-- Enable RLS
ALTER TABLE lopivi_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Reporters can view their own reports
CREATE POLICY "Reporters can view their own reports"
  ON lopivi_reports
  FOR SELECT
  TO authenticated
  USING (reporter_profile_id = auth.uid());

-- Policy: Reporters can insert their own reports
CREATE POLICY "Reporters can insert reports"
  ON lopivi_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_profile_id = auth.uid());

-- Policy: Club admins can view all reports for their clubs
CREATE POLICY "Club admins can view reports for their clubs"
  ON lopivi_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = lopivi_reports.club_id
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

-- Policy: Club admins can update reports for their clubs
CREATE POLICY "Club admins can update reports for their clubs"
  ON lopivi_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = lopivi_reports.club_id
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

-- Policy: Super admins can view all reports
CREATE POLICY "Super admins can view all reports"
  ON lopivi_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Super admins can update all reports
CREATE POLICY "Super admins can update all reports"
  ON lopivi_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE lopivi_reports IS 'Reportes e incidencias relacionadas con LOPIVI (Ley Orgánica de Protección Integral a la Infancia y Adolescencia)';
