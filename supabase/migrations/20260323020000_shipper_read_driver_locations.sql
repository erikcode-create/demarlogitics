-- Allow shipper portal users to read driver locations for their loads
CREATE POLICY "Shipper portal read driver locations"
ON public.driver_locations
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loads l
    JOIN public.shipper_portal_users spu ON spu.shipper_id = l.shipper_id
    WHERE l.id::text = driver_locations.load_id
      AND spu.user_id = auth.uid()
  )
);
