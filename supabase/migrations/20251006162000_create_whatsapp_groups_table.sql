-- Create whatsapp_groups table for managing WhatsApp group connections
-- Allows trainers and clubs to link WhatsApp groups for automatic notifications

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  trainer_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_name TEXT NOT NULL,
  group_chat_id TEXT NOT NULL, -- WhatsApp group ID (e.g., 123456789@g.us or phone number)
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- A group chat ID should be unique
  UNIQUE(group_chat_id),

  -- Either club_id or trainer_profile_id must be set (not both null)
  CHECK (club_id IS NOT NULL OR trainer_profile_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_whatsapp_groups_club ON whatsapp_groups(club_id) WHERE is_active = true;
CREATE INDEX idx_whatsapp_groups_trainer ON whatsapp_groups(trainer_profile_id) WHERE is_active = true;
CREATE INDEX idx_whatsapp_groups_active ON whatsapp_groups(is_active);

-- Comments
COMMENT ON TABLE whatsapp_groups IS 'Stores WhatsApp group connections for sending notifications about class availability';
COMMENT ON COLUMN whatsapp_groups.club_id IS 'Club this group belongs to (optional if trainer-specific)';
COMMENT ON COLUMN whatsapp_groups.trainer_profile_id IS 'Trainer this group belongs to (optional if club-wide)';
COMMENT ON COLUMN whatsapp_groups.group_chat_id IS 'WhatsApp group chat ID or phone number for Whapi.cloud API';
COMMENT ON COLUMN whatsapp_groups.is_active IS 'Whether this group is currently active for notifications';

-- Enable RLS
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Trainers can view their own groups
CREATE POLICY "Trainers can view their own WhatsApp groups" ON whatsapp_groups
  FOR SELECT USING (
    trainer_profile_id = auth.uid()
  );

-- Trainers can manage their own groups
CREATE POLICY "Trainers can manage their own WhatsApp groups" ON whatsapp_groups
  FOR ALL USING (
    trainer_profile_id = auth.uid()
  );

-- Club admins can view groups for their clubs
CREATE POLICY "Club admins can view club WhatsApp groups" ON whatsapp_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.id = whatsapp_groups.club_id
        AND c.created_by_profile_id = auth.uid()
    )
  );

-- Club admins can manage groups for their clubs
CREATE POLICY "Club admins can manage club WhatsApp groups" ON whatsapp_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clubs c
      WHERE c.id = whatsapp_groups.club_id
        AND c.created_by_profile_id = auth.uid()
    )
  );

-- Super admins can do everything
CREATE POLICY "Admins can manage all WhatsApp groups" ON whatsapp_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_groups_timestamp
  BEFORE UPDATE ON whatsapp_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_groups_updated_at();
