
-- Create a security definer function to check if user is a carrier portal user
CREATE OR REPLACE FUNCTION public.is_carrier_portal_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.carrier_portal_users
    WHERE user_id = _user_id
  )
$$;

-- Drop problematic policies
DROP POLICY IF EXISTS "Internal team full access" ON public.carrier_documents;
DROP POLICY IF EXISTS "Carriers can read own documents" ON public.carrier_documents;
DROP POLICY IF EXISTS "Carriers can sign own documents" ON public.carrier_documents;
DROP POLICY IF EXISTS "Users can read own portal record" ON public.carrier_portal_users;
DROP POLICY IF EXISTS "Allow self insert portal user" ON public.carrier_portal_users;
DROP POLICY IF EXISTS "Internal team read portal users" ON public.carrier_portal_users;

-- Recreate carrier_documents policies using the security definer function
CREATE POLICY "Internal team full access" ON public.carrier_documents
FOR ALL TO authenticated
USING (NOT public.is_carrier_portal_user(auth.uid()))
WITH CHECK (NOT public.is_carrier_portal_user(auth.uid()));

CREATE POLICY "Carriers can read own documents" ON public.carrier_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.carrier_portal_users
    WHERE user_id = auth.uid() AND carrier_id = carrier_documents.carrier_id
  )
);

CREATE POLICY "Carriers can sign own documents" ON public.carrier_documents
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.carrier_portal_users
    WHERE user_id = auth.uid() AND carrier_id = carrier_documents.carrier_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.carrier_portal_users
    WHERE user_id = auth.uid() AND carrier_id = carrier_documents.carrier_id
  )
);

-- Recreate carrier_portal_users policies using the security definer function
CREATE POLICY "Users can read own portal record" ON public.carrier_portal_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow self insert portal user" ON public.carrier_portal_users
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Internal team read portal users" ON public.carrier_portal_users
FOR SELECT TO authenticated
USING (NOT public.is_carrier_portal_user(auth.uid()));
