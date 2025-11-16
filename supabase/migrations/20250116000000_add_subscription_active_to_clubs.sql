-- Add subscription active field to clubs table
-- This allows manual blocking of clubs when subscription is not paid

ALTER TABLE clubs
ADD COLUMN IF NOT EXISTS is_subscription_active BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN clubs.is_subscription_active IS 'Indica si el club tiene una suscripción activa. Se puede modificar manualmente para bloquear el acceso.';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_clubs_subscription_active ON clubs(is_subscription_active);
