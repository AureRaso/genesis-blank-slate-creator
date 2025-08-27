-- Add Stripe account information to clubs table
ALTER TABLE public.clubs 
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN stripe_account_status TEXT DEFAULT 'disconnected',
ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT false;