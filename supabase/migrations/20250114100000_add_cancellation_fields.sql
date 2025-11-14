-- Add cancellation tracking fields to club_subscriptions table

ALTER TABLE club_subscriptions
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN club_subscriptions.cancellation_reason IS 'Motivo proporcionado por el usuario al cancelar la suscripción';
COMMENT ON COLUMN club_subscriptions.cancellation_requested_at IS 'Fecha y hora en que el usuario solicitó la cancelación';
