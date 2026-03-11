-- Fix loads visibility: make shipper portal SELECT policy permissive instead of restrictive
DROP POLICY IF EXISTS "Shipper portal read loads" ON public.loads;

CREATE POLICY "Shipper portal read loads"
ON public.loads
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.shipper_portal_users
    WHERE shipper_portal_users.user_id = auth.uid()
      AND shipper_portal_users.shipper_id = loads.shipper_id
  )
);