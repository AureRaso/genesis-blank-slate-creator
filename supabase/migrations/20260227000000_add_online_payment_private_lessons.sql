-- =============================================================================
-- Migration: Add online payment support for private lessons (Stripe Connect)
-- =============================================================================

-- Flag to enable online payment for private lessons at the club level
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS enable_private_lesson_online_payment BOOLEAN NOT NULL DEFAULT false;

-- Stripe payment tracking columns on private_lesson_bookings
ALTER TABLE private_lesson_bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_status TEXT DEFAULT NULL;

-- Indexes for webhook lookups
CREATE INDEX IF NOT EXISTS idx_plb_stripe_payment_intent
  ON private_lesson_bookings(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plb_stripe_checkout_session
  ON private_lesson_bookings(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
