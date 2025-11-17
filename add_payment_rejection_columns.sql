-- =====================================================
-- ADD PAYMENT REJECTION COLUMNS
-- =====================================================
-- Adds columns to monthly_payments table to support payment rejection workflow

-- Add rejection tracking columns
ALTER TABLE monthly_payments
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comments for documentation
COMMENT ON COLUMN monthly_payments.rejected_at IS 'Timestamp when payment was rejected by admin/trainer';
COMMENT ON COLUMN monthly_payments.rejected_by IS 'ID of the admin/trainer who rejected the payment';
COMMENT ON COLUMN monthly_payments.rejection_reason IS 'Reason provided for payment rejection (visible to student)';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
