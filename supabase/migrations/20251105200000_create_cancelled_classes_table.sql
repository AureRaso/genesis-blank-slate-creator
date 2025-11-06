-- Create table to track cancelled classes by specific date
-- This allows cancelling individual instances of recurring classes without deleting the whole series

CREATE TABLE IF NOT EXISTS public.cancelled_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    programmed_class_id UUID NOT NULL REFERENCES public.programmed_classes(id) ON DELETE CASCADE,
    cancelled_date DATE NOT NULL,
    cancelled_by UUID NOT NULL REFERENCES public.profiles(id),
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate cancellations for the same class on the same date
    UNIQUE(programmed_class_id, cancelled_date)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS cancelled_classes_programmed_class_id_idx ON public.cancelled_classes(programmed_class_id);
CREATE INDEX IF NOT EXISTS cancelled_classes_cancelled_date_idx ON public.cancelled_classes(cancelled_date);

-- Enable RLS
ALTER TABLE public.cancelled_classes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all cancelled classes
CREATE POLICY "Allow authenticated users to view cancelled classes"
ON public.cancelled_classes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow admins and trainers to cancel classes
CREATE POLICY "Allow admins and trainers to cancel classes"
ON public.cancelled_classes
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'trainer')
    )
);

-- Policy: Allow admins and trainers to un-cancel classes (delete cancellation)
CREATE POLICY "Allow admins and trainers to un-cancel classes"
ON public.cancelled_classes
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'trainer')
    )
);

-- Add comment
COMMENT ON TABLE public.cancelled_classes IS 'Stores cancelled instances of recurring programmed classes by specific date';
