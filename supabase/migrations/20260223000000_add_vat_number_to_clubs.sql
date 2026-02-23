-- Add VAT number field for EU clubs (non-Spain)
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- Update default country from 'Spain' to 'España' for consistency
ALTER TABLE clubs ALTER COLUMN billing_country SET DEFAULT 'España';