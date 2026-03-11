
-- Allow carrier portal users to read their own loads
CREATE POLICY "Carrier portal read loads"
ON public.loads
FOR SELECT
TO authenticated
USING (
  carrier_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM carrier_portal_users
    WHERE carrier_portal_users.user_id = auth.uid()
      AND carrier_portal_users.carrier_id = loads.carrier_id
  )
);
