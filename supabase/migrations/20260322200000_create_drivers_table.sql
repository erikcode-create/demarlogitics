-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Authenticated users can do all CRUD
CREATE POLICY "Authenticated users can select drivers"
  ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert drivers"
  ON public.drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update drivers"
  ON public.drivers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete drivers"
  ON public.drivers FOR DELETE TO authenticated USING (true);

-- Auto-populate from existing load data
INSERT INTO public.drivers (name, phone, carrier_id)
SELECT DISTINCT ON (driver_phone)
  driver_name,
  driver_phone,
  carrier_id
FROM public.loads
WHERE driver_phone IS NOT NULL
  AND driver_phone != ''
  AND driver_name IS NOT NULL
  AND driver_name != '';
