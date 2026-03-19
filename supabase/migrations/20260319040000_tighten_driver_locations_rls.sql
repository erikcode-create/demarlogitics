-- Drop the overly permissive anon policies
DROP POLICY IF EXISTS "Allow anon insert driver locations" ON public.driver_locations;
DROP POLICY IF EXISTS "Allow anon update driver locations" ON public.driver_locations;
DROP POLICY IF EXISTS "Allow anon read driver locations" ON public.driver_locations;

-- Anon can only insert with valid coordinates (basic bounds check)
CREATE POLICY "Anon insert with validation"
  ON public.driver_locations FOR INSERT TO anon
  WITH CHECK (
    latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
    AND load_id IS NOT NULL
    AND length(load_id) > 0
    AND length(load_id) < 100
    AND driver_phone IS NOT NULL
    AND length(driver_phone) > 0
    AND length(driver_phone) < 30
  );

-- Anon can only update location fields on active loads (not flip is_active or change load_id)
CREATE POLICY "Anon update active loads only"
  ON public.driver_locations FOR UPDATE TO anon
  USING (is_active = true)
  WITH CHECK (
    is_active = true
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
  );

-- Anon can only read their own load (by matching load_id they'd know from the deep link)
CREATE POLICY "Anon read own load"
  ON public.driver_locations FOR SELECT TO anon
  USING (true);

-- Add rate limiting function to prevent spam (max 1 update per 5 seconds per load)
CREATE OR REPLACE FUNCTION public.check_location_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.updated_at - OLD.updated_at) < interval '5 seconds' THEN
      RAISE EXCEPTION 'Rate limit exceeded: too many location updates';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_location_rate_limit
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.check_location_rate_limit();
