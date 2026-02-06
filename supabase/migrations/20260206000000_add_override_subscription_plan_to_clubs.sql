-- Add override_subscription_plan_id to clubs table
-- When set, this plan will be used instead of auto-calculating based on player count
ALTER TABLE clubs
ADD COLUMN override_subscription_plan_id UUID REFERENCES subscription_plans(id) DEFAULT NULL;

COMMENT ON COLUMN clubs.override_subscription_plan_id IS 'When set, forces this subscription plan for the club instead of auto-calculating by player count';