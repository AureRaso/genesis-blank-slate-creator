-- Add Stripe product and price fields to programmed_classes
ALTER TABLE public.programmed_classes
ADD COLUMN stripe_product_id TEXT,
ADD COLUMN stripe_price_id TEXT;

-- Create indexes for Stripe fields
CREATE INDEX idx_programmed_classes_stripe_product ON public.programmed_classes(stripe_product_id);
CREATE INDEX idx_programmed_classes_stripe_price ON public.programmed_classes(stripe_price_id);

-- Create class_subscriptions table
CREATE TABLE public.class_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_enrollment_id UUID NOT NULL REFERENCES public.student_enrollments(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.programmed_classes(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Ensure unique subscription per student-class combination
  CONSTRAINT unique_student_class_subscription UNIQUE (student_enrollment_id, class_id)
);

-- Add subscription_id field to class_participants
ALTER TABLE public.class_participants
ADD COLUMN subscription_id UUID REFERENCES public.class_subscriptions(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_class_subscriptions_student_enrollment ON public.class_subscriptions(student_enrollment_id);
CREATE INDEX idx_class_subscriptions_class_id ON public.class_subscriptions(class_id);
CREATE INDEX idx_class_subscriptions_stripe_subscription ON public.class_subscriptions(stripe_subscription_id);
CREATE INDEX idx_class_subscriptions_stripe_customer ON public.class_subscriptions(stripe_customer_id);
CREATE INDEX idx_class_subscriptions_status ON public.class_subscriptions(status);
CREATE INDEX idx_class_participants_subscription ON public.class_participants(subscription_id);

-- Enable RLS
ALTER TABLE public.class_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_subscriptions
CREATE POLICY "Students can view their own subscriptions"
ON public.class_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_enrollments se
    WHERE se.id = class_subscriptions.student_enrollment_id
    AND se.created_by_profile_id = auth.uid()
  )
);

CREATE POLICY "Club admins can manage subscriptions in their clubs"
ON public.class_subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM programmed_classes pc
    JOIN clubs c ON pc.club_id = c.id
    WHERE pc.id = class_subscriptions.class_id
    AND c.created_by_profile_id = auth.uid()
  )
);

CREATE POLICY "Trainers can manage subscriptions for their classes"
ON public.class_subscriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM programmed_classes pc
    JOIN trainer_clubs tc ON pc.club_id = tc.club_id
    WHERE pc.id = class_subscriptions.class_id
    AND tc.trainer_profile_id = auth.uid()
  )
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_class_subscriptions_updated_at
  BEFORE UPDATE ON public.class_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle subscription status changes
CREATE OR REPLACE FUNCTION handle_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update class_participants status based on subscription status
  IF NEW.status = 'active' THEN
    UPDATE class_participants
    SET
      payment_status = 'paid',
      payment_verified = true,
      status = 'active'
    WHERE subscription_id = NEW.id;
  ELSIF NEW.status IN ('past_due', 'unpaid') THEN
    UPDATE class_participants
    SET
      payment_status = 'overdue',
      status = 'active'
    WHERE subscription_id = NEW.id;
  ELSIF NEW.status = 'canceled' THEN
    UPDATE class_participants
    SET
      status = 'inactive'
    WHERE subscription_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription status changes
CREATE TRIGGER trigger_subscription_status_change
  AFTER UPDATE OF status ON public.class_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_status_change();