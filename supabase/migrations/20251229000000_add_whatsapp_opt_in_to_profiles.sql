-- Migration: Add WhatsApp opt-in fields to profiles
-- Purpose: Track users who activate WhatsApp notifications and show modal until they do

-- Add fields for WhatsApp opt-in tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS whatsapp_opt_in_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in_dismissed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in_date TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN profiles.whatsapp_opt_in_completed IS 'User clicked "Activate WhatsApp" button';
COMMENT ON COLUMN profiles.whatsapp_opt_in_dismissed IS 'User clicked "Do not show again" link';
COMMENT ON COLUMN profiles.whatsapp_opt_in_date IS 'Timestamp when user completed or dismissed the modal';

-- Index for faster queries on these fields
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_opt_in
ON profiles(whatsapp_opt_in_completed, whatsapp_opt_in_dismissed)
WHERE role IN ('player', 'guardian');
