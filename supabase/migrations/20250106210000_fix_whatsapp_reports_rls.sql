-- Fix RLS policies for whatsapp_report_groups
-- The previous policies referenced clubs.created_by_profile_id which doesn't exist
-- Owners and admins should be able to manage WhatsApp groups for any club

-- Drop existing policies
DROP POLICY IF EXISTS "Owners can manage their club WhatsApp groups" ON whatsapp_report_groups;
DROP POLICY IF EXISTS "Super admins can view all WhatsApp groups" ON whatsapp_report_groups;

-- Create new policies for owners and admins
-- Owners can manage any club (they have access to all clubs in the platform)
-- Admins also have full access
CREATE POLICY "Owners and admins can view WhatsApp groups"
  ON whatsapp_report_groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can insert WhatsApp groups"
  ON whatsapp_report_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update WhatsApp groups"
  ON whatsapp_report_groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete WhatsApp groups"
  ON whatsapp_report_groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- Add comment
COMMENT ON TABLE whatsapp_report_groups IS 'WhatsApp group configuration for daily reports - accessible to owners and admins';
