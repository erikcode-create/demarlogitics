-- Allow shipper portal users to INSERT loads for their own shipper
CREATE POLICY "Shipper portal insert loads"
ON public.loads
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipper_portal_users
    WHERE shipper_portal_users.user_id = auth.uid()
      AND shipper_portal_users.shipper_id = loads.shipper_id
  )
  AND carrier_id IS NULL
  AND status = 'available'
);

-- Ensure load numbers are unique
ALTER TABLE public.loads ADD CONSTRAINT loads_load_number_unique UNIQUE (load_number);
