
-- Storage policies for load-documents bucket
CREATE POLICY "Authenticated users can upload load documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'load-documents');

CREATE POLICY "Authenticated users can read load documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'load-documents');

CREATE POLICY "Authenticated users can update load documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'load-documents')
WITH CHECK (bucket_id = 'load-documents');

CREATE POLICY "Authenticated users can delete load documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'load-documents');

-- Also allow anon access for carrier uploads via phone
CREATE POLICY "Anon can upload load documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'load-documents');

CREATE POLICY "Anon can read load documents"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'load-documents');
