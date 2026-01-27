-- =====================================================
-- Create Subscription Plans Table
-- Stores the different Padelock subscription tiers
-- based on number of players per club
-- =====================================================

-- Create the subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_players INT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups by max_players
CREATE INDEX idx_subscription_plans_max_players ON public.subscription_plans(max_players);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read subscription plans (public pricing)
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (true);

-- Only service_role can insert/update/delete
CREATE POLICY "Service role can manage subscription plans"
  ON public.subscription_plans
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert the 8 Padelock plans
INSERT INTO public.subscription_plans (name, max_players, price_monthly, stripe_price_id, stripe_product_id) VALUES
  ('Padelock50', 50, 50.00, 'price_1Ss0jnHP1cYL4WsGwmGUK454', 'prod_Tpg5n2A8TVHpim'),
  ('Padelock100', 100, 65.00, 'price_1Ss0hbHP1cYL4WsGf1r0iViC', 'prod_Tpg32RhFOUJFJy'),
  ('Padelock150', 150, 85.00, 'price_1Ss0jAHP1cYL4WsGjSaaqVPq', 'prod_Tpg5VffCCXiwbM'),
  ('Padelock200', 200, 100.00, 'price_1Ss0kVHP1cYL4WsGqmCuwlFR', 'prod_Tpg6fUTvnudYoX'),
  ('Padelock250', 250, 125.00, 'price_1Ss0lLHP1cYL4WsGLwPcSyzw', 'prod_Tpg7yiypTgvJIW'),
  ('Padelock300', 300, 150.00, 'price_1Ss0lvHP1cYL4WsG2FXBq4At', 'prod_Tpg8YofuAzCoYU'),
  ('Padelock350', 350, 175.00, 'price_1Ss0mWHP1cYL4WsGpQ7sEl9h', 'prod_Tpg81CLtd9uWL2'),
  ('Padelock400', 400, 200.00, 'price_1Ss0mzHP1cYL4WsGgxYd1Mj3', 'prod_Tpg9cD9oJKiDej')
ON CONFLICT DO NOTHING;

-- Add subscription_plan_id to club_subscriptions for tracking
ALTER TABLE public.club_subscriptions
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id);

-- Add comment
COMMENT ON TABLE public.subscription_plans IS 'Subscription plans for clubs based on number of players. Each plan has a max player limit and corresponding Stripe price.';