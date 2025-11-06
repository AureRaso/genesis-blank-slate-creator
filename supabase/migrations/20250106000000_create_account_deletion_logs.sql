-- Create account_deletion_logs table to track account deletions
CREATE TABLE IF NOT EXISTS account_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  reason TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_account_deletion_logs_user_id ON account_deletion_logs(user_id);
CREATE INDEX idx_account_deletion_logs_deleted_at ON account_deletion_logs(deleted_at);

-- Add RLS policies
ALTER TABLE account_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view deletion logs
CREATE POLICY "Admins can view all deletion logs"
  ON account_deletion_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can insert their own deletion log
CREATE POLICY "Users can insert their own deletion log"
  ON account_deletion_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
