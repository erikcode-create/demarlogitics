
-- Create carrier_onboarding_documents table
CREATE TABLE public.carrier_onboarding_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_path text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (carrier_id, document_type)
);

ALTER TABLE public.carrier_onboarding_documents ENABLE ROW LEVEL SECURITY;

-- Internal team full access
CREATE POLICY "Internal team full access on onboarding docs"
ON public.carrier_onboarding_documents
FOR ALL
TO authenticated
USING (NOT is_carrier_portal_user(auth.uid()))
WITH CHECK (NOT is_carrier_portal_user(auth.uid()));

-- Carrier portal users can read their own
CREATE POLICY "Carriers can read own onboarding docs"
ON public.carrier_onboarding_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM carrier_portal_users
    WHERE carrier_portal_users.user_id = auth.uid()
    AND carrier_portal_users.carrier_id = carrier_onboarding_documents.carrier_id
  )
);

-- Carrier portal users can insert their own
CREATE POLICY "Carriers can insert own onboarding docs"
ON public.carrier_onboarding_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM carrier_portal_users
    WHERE carrier_portal_users.user_id = auth.uid()
    AND carrier_portal_users.carrier_id = carrier_onboarding_documents.carrier_id
  )
);

-- Create storage bucket for onboarding docs
INSERT INTO storage.buckets (id, name, public) VALUES ('carrier-onboarding-docs', 'carrier-onboarding-docs', false);

-- Storage RLS: carriers can upload to their own folder
CREATE POLICY "Carriers can upload own onboarding docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'carrier-onboarding-docs'
  AND (storage.foldername(name))[1] IN (
    SELECT carrier_id::text FROM carrier_portal_users WHERE user_id = auth.uid()
  )
);

-- Storage RLS: carriers can read own files
CREATE POLICY "Carriers can read own onboarding files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'carrier-onboarding-docs'
  AND (storage.foldername(name))[1] IN (
    SELECT carrier_id::text FROM carrier_portal_users WHERE user_id = auth.uid()
  )
);

-- Storage RLS: internal team can read all
CREATE POLICY "Internal team can read all onboarding files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'carrier-onboarding-docs'
  AND NOT is_carrier_portal_user(auth.uid())
);
