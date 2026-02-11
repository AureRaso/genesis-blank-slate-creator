-- Change unique constraint from stripe_subscription_id alone to (club_id, stripe_subscription_id)
-- This allows multiple clubs (from same superadmin) to share the same Stripe subscription
ALTER TABLE club_subscriptions
  DROP CONSTRAINT IF EXISTS club_subscriptions_stripe_subscription_id_key;

ALTER TABLE club_subscriptions
  ADD CONSTRAINT club_subscriptions_club_stripe_unique
  UNIQUE(club_id, stripe_subscription_id);