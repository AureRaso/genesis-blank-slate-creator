-- Add currency column to clubs table
-- Supports multiple currencies for international clubs

ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';

-- Add comment for documentation
COMMENT ON COLUMN clubs.currency IS 'ISO 4217 currency code (EUR, USD, MXN, etc.)';

-- Update existing clubs to have EUR as default (already handled by DEFAULT, but explicit)
UPDATE clubs SET currency = 'EUR' WHERE currency IS NULL;