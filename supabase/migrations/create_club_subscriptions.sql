-- Tabla para almacenar las suscripciones de los clubes
CREATE TABLE IF NOT EXISTS club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_club_id ON club_subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_stripe_customer_id ON club_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_stripe_subscription_id ON club_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_club_subscriptions_status ON club_subscriptions(status);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_club_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_subscriptions_updated_at
  BEFORE UPDATE ON club_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_club_subscriptions_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;

-- Los admins del club pueden ver su propia suscripción
CREATE POLICY "Club admins can view their subscription"
  ON club_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.club_id = club_subscriptions.club_id
      AND profiles.role = 'admin'
    )
  );

-- Los owners pueden ver todas las suscripciones
CREATE POLICY "Owners can view all subscriptions"
  ON club_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- Solo el sistema (service_role) puede insertar/actualizar suscripciones
CREATE POLICY "Service role can manage subscriptions"
  ON club_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comentarios para documentación
COMMENT ON TABLE club_subscriptions IS 'Almacena las suscripciones de Stripe de los clubes';
COMMENT ON COLUMN club_subscriptions.stripe_customer_id IS 'ID del cliente en Stripe';
COMMENT ON COLUMN club_subscriptions.stripe_subscription_id IS 'ID de la suscripción en Stripe';
COMMENT ON COLUMN club_subscriptions.stripe_price_id IS 'ID del precio/plan en Stripe';
COMMENT ON COLUMN club_subscriptions.status IS 'Estado de la suscripción: pending, active, canceled, past_due, trialing';
COMMENT ON COLUMN club_subscriptions.cancel_at_period_end IS 'Si es true, la suscripción se cancelará al final del período actual';
