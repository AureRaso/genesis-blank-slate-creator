-- Add billing/fiscal fields to clubs table for Holded integration
-- These fields are all nullable - not required when creating a club
-- They are filled in later when the admin configures billing in Settings

-- Fiscal identity fields
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS legal_entity_type VARCHAR(20) DEFAULT 'empresa';

-- Billing contact
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS billing_email TEXT;

-- Billing address (may differ from club physical address)
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS billing_city TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(10);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS billing_province TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS billing_country VARCHAR(50) DEFAULT 'Spain';

-- Holded integration
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS holded_contact_id TEXT;

-- Documentation
COMMENT ON COLUMN clubs.legal_name IS 'Razón social para facturación (ej: Club Padel Madrid S.L.)';
COMMENT ON COLUMN clubs.tax_id IS 'NIF/CIF/VAT del club';
COMMENT ON COLUMN clubs.legal_entity_type IS 'Tipo de entidad: empresa, asociacion, autonomo';
COMMENT ON COLUMN clubs.billing_email IS 'Email de facturación (puede diferir del email de contacto)';
COMMENT ON COLUMN clubs.billing_address IS 'Dirección fiscal (calle y número)';
COMMENT ON COLUMN clubs.billing_city IS 'Ciudad fiscal';
COMMENT ON COLUMN clubs.billing_postal_code IS 'Código postal fiscal';
COMMENT ON COLUMN clubs.billing_province IS 'Provincia fiscal';
COMMENT ON COLUMN clubs.billing_country IS 'País fiscal (por defecto Spain)';
COMMENT ON COLUMN clubs.holded_contact_id IS 'ID del contacto sincronizado en Holded';

-- Create holded_invoices table for tracking synced invoices (idempotency)
CREATE TABLE IF NOT EXISTS holded_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  holded_invoice_id TEXT,
  holded_invoice_num TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_holded_invoices_club_id ON holded_invoices(club_id);
CREATE INDEX IF NOT EXISTS idx_holded_invoices_stripe_invoice_id ON holded_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_holded_invoices_status ON holded_invoices(status);
CREATE INDEX IF NOT EXISTS idx_clubs_holded_contact_id ON clubs(holded_contact_id);

-- RLS for holded_invoices
ALTER TABLE holded_invoices ENABLE ROW LEVEL SECURITY;

-- Admins can view their club's holded invoices
CREATE POLICY "Admins can view own club holded invoices"
  ON holded_invoices FOR SELECT
  USING (
    club_id IN (
      SELECT c.id FROM clubs c
      WHERE c.created_by_profile_id = auth.uid()
    )
    OR
    club_id IN (
      SELECT ac.club_id FROM admin_clubs ac
      WHERE ac.admin_profile_id = auth.uid()
    )
  );

-- Service role handles inserts/updates (via Edge Functions)
-- No insert/update policies needed for regular users