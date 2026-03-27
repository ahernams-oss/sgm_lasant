INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on documentos" ON storage.objects FOR SELECT USING (bucket_id = 'documentos');

CREATE POLICY "Allow authenticated upload to documentos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Allow authenticated update on documentos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documentos');