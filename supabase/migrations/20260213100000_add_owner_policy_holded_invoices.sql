-- Allow owners to view ALL holded invoices across all clubs
CREATE POLICY "Owners can view all holded invoices"
  ON holded_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'owner'
    )
  );