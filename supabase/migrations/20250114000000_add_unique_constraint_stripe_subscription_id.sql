-- Add unique constraint to stripe_subscription_id
-- This allows us to use upsert with ON CONFLICT in webhooks

ALTER TABLE club_subscriptions
ADD CONSTRAINT club_subscriptions_stripe_subscription_id_key
UNIQUE (stripe_subscription_id);

-- Add comment
COMMENT ON CONSTRAINT club_subscriptions_stripe_subscription_id_key
ON club_subscriptions IS 'Ensures stripe_subscription_id is unique to prevent duplicate subscriptions';
