
-- Create shipper_portal_users table
CREATE TABLE public.shipper_portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shipper_id uuid NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, shipper_id)
);

ALTER TABLE public.shipper_portal_users ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.is_shipper_portal_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shipper_portal_users
    WHERE user_id = _user_id
  )
$$;

-- Permissive base policy
CREATE POLICY "Permissive authenticated" ON public.shipper_portal_users
  AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Restrictive: self insert
CREATE POLICY "Allow self insert" ON public.shipper_portal_users
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Restrictive: self read
CREATE POLICY "Users can read own record" ON public.shipper_portal_users
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR NOT is_shipper_portal_user(auth.uid()));

-- Internal team can manage
CREATE POLICY "Internal team full access" ON public.shipper_portal_users
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (NOT is_shipper_portal_user(auth.uid()))
  WITH CHECK (NOT is_shipper_portal_user(auth.uid()));

-- Allow shipper portal users to READ contracts for their shipper
CREATE POLICY "Shipper portal read contracts" ON public.contracts
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    entity_type = 'shipper' AND EXISTS (
      SELECT 1 FROM shipper_portal_users
      WHERE shipper_portal_users.user_id = auth.uid()
        AND shipper_portal_users.shipper_id::text = contracts.entity_id
    )
  );

-- Allow shipper portal users to UPDATE contracts (for signing)
CREATE POLICY "Shipper portal sign contracts" ON public.contracts
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (
    entity_type = 'shipper' AND EXISTS (
      SELECT 1 FROM shipper_portal_users
      WHERE shipper_portal_users.user_id = auth.uid()
        AND shipper_portal_users.shipper_id::text = contracts.entity_id
    )
  )
  WITH CHECK (
    entity_type = 'shipper' AND EXISTS (
      SELECT 1 FROM shipper_portal_users
      WHERE shipper_portal_users.user_id = auth.uid()
        AND shipper_portal_users.shipper_id::text = contracts.entity_id
    )
  );

-- Allow shipper portal users to read their loads (but not carrier_rate)
CREATE POLICY "Shipper portal read loads" ON public.loads
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shipper_portal_users
      WHERE shipper_portal_users.user_id = auth.uid()
        AND shipper_portal_users.shipper_id = loads.shipper_id
    )
  );
