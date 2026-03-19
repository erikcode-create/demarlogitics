-- Carrier Workflow & Document Management
-- Adds driver fields, timestamp audit trail, load_documents, load_events tables

-- =============================================
-- 1. Add columns to loads table
-- =============================================
ALTER TABLE loads ADD COLUMN IF NOT EXISTS driver_phone text;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS driver_name text;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS rate_con_signed_at timestamptz;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS picked_up_at timestamptz;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS pod_submitted_at timestamptz;
ALTER TABLE loads ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- =============================================
-- 2. Create load_documents table
-- =============================================
CREATE TABLE IF NOT EXISTS load_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id uuid NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('rate_con_signed', 'bol_photo', 'delivery_photo', 'pod_signature')),
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  uploaded_by_phone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_load_documents_load_id ON load_documents(load_id);
CREATE INDEX IF NOT EXISTS idx_load_documents_type ON load_documents(document_type);

-- RLS for load_documents (anon access for driver app)
ALTER TABLE load_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_load_documents" ON load_documents
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_load_documents" ON load_documents
  FOR SELECT TO anon USING (true);

CREATE POLICY "authenticated_all_load_documents" ON load_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 3. Create load_events table (timeline)
-- =============================================
CREATE TABLE IF NOT EXISTS load_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id uuid NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('status_change', 'document_uploaded', 'note')),
  from_status text,
  to_status text,
  description text,
  actor text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_load_events_load_id ON load_events(load_id);

-- RLS for load_events (anon access for driver app)
ALTER TABLE load_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_load_events" ON load_events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_load_events" ON load_events
  FOR SELECT TO anon USING (true);

CREATE POLICY "authenticated_all_load_events" ON load_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 4. Create load-documents storage bucket
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'load-documents',
  'load-documents',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for load-documents bucket
CREATE POLICY "anon_upload_load_documents" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'load-documents');

CREATE POLICY "anon_read_load_documents" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'load-documents');

CREATE POLICY "authenticated_all_load_documents_storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'load-documents')
  WITH CHECK (bucket_id = 'load-documents');
