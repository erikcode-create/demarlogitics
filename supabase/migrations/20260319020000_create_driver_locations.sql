-- Driver location tracking table
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id text NOT NULL UNIQUE,
  driver_phone text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed double precision,
  heading double precision,
  accuracy double precision,
  is_active boolean DEFAULT true,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for active loads
CREATE INDEX idx_driver_locations_active ON public.driver_locations (is_active) WHERE is_active = true;
CREATE INDEX idx_driver_locations_load_id ON public.driver_locations (load_id);

-- Enable RLS
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts/updates (driver app uses anon key)
CREATE POLICY "Allow anon insert driver locations"
  ON public.driver_locations FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update driver locations"
  ON public.driver_locations FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- Allow authenticated users (brokers) to read all locations
CREATE POLICY "Allow authenticated read driver locations"
  ON public.driver_locations FOR SELECT TO authenticated
  USING (true);

-- Allow anon to read (so driver app can check status)
CREATE POLICY "Allow anon read driver locations"
  ON public.driver_locations FOR SELECT TO anon
  USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_driver_location_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_driver_location_timestamp
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_location_timestamp();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
