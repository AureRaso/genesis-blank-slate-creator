-- Add canceled_at column to class_subscriptions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'class_subscriptions'
        AND column_name = 'canceled_at'
    ) THEN
        ALTER TABLE public.class_subscriptions
        ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
