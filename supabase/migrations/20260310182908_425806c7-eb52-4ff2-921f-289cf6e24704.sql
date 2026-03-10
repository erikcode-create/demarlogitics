
-- Create carrier_documents table
CREATE TABLE public.carrier_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  load_id uuid NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'rate_con',
  document_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  signed_by_name text NOT NULL DEFAULT '',
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create carrier_portal_users table
CREATE TABLE public.carrier_portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.carrier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_portal_users ENABLE ROW LEVEL SECURITY;

-- carrier_documents: internal team full access (users NOT in carrier_portal_users)
CREATE POLICY "Internal team full access" ON public.carrier_documents
FOR ALL TO authenticated
USING (
  NOT EXISTS (SELECT 1 FROM public.carrier_portal_users WHERE user_id = auth.uid())
)
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM public.carrier_portal_users WHERE user_id = auth.uid())
);

-- carrier_documents: carrier can read their own docs
CREATE POLICY "Carriers can read own documents" ON public.carrier_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.carrier_portal_users
    WHERE user_id = auth.uid() AND carrier_id = carrier_documents.carrier_id
  )
);

-- carrier_documents: carrier can update (sign) their own pending docs
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

-- carrier_portal_users: users can read their own record
CREATE POLICY "Users can read own portal record" ON public.carrier_portal_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- carrier_portal_users: allow insert for self-linking
CREATE POLICY "Allow self insert portal user" ON public.carrier_portal_users
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Internal team can read all portal users (non-carrier users)
CREATE POLICY "Internal team read portal users" ON public.carrier_portal_users
FOR SELECT TO authenticated
USING (
  NOT EXISTS (SELECT 1 FROM public.carrier_portal_users cp WHERE cp.user_id = auth.uid())
);
