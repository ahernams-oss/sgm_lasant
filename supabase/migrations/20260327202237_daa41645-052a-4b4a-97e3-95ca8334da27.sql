DROP POLICY "Allow authenticated upload to documentos" ON storage.objects;
DROP POLICY "Allow authenticated update on documentos" ON storage.objects;

CREATE POLICY "Allow public upload to documentos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Allow public update on documentos" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'documentos') WITH CHECK (bucket_id = 'documentos');