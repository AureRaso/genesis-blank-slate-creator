-- Simplified table for WhatsApp group configuration (owner role only)
CREATE TABLE IF NOT EXISTS whatsapp_report_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE UNIQUE,
  group_name TEXT NOT NULL,
  whatsapp_group_id TEXT NOT NULL, -- WhatsApp Group ID (e.g., "34666777888-1234567890@g.us")
  is_active BOOLEAN DEFAULT true,

  -- Report configuration
  send_morning_report BOOLEAN DEFAULT true, -- 10:00 report
  send_afternoon_report BOOLEAN DEFAULT true, -- 13:00 report
  morning_report_time TIME DEFAULT '10:00:00',
  afternoon_report_time TIME DEFAULT '13:00:00',
  timezone TEXT DEFAULT 'Europe/Madrid',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_whatsapp_report_groups_club_id ON whatsapp_report_groups(club_id);
CREATE INDEX idx_whatsapp_report_groups_active ON whatsapp_report_groups(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE whatsapp_report_groups ENABLE ROW LEVEL SECURITY;

-- Owner can manage their club's WhatsApp group configuration
CREATE POLICY "Owners can manage their club WhatsApp groups"
  ON whatsapp_report_groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = whatsapp_report_groups.club_id
      AND clubs.created_by_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = whatsapp_report_groups.club_id
      AND clubs.created_by_profile_id = auth.uid()
    )
  );

-- Super admins can view all configurations
CREATE POLICY "Super admins can view all WhatsApp groups"
  ON whatsapp_report_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE whatsapp_report_groups IS 'WhatsApp group configuration for daily reports per club (owner role)';
