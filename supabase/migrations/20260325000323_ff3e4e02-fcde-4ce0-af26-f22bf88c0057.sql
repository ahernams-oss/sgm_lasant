INSERT INTO storage.buckets (id, name, public) VALUES ('empresa-logo', 'empresa-logo', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read empresa-logo" ON storage.objects FOR SELECT TO public USING (bucket_id = 'empresa-logo');
CREATE POLICY "Allow upload empresa-logo" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'empresa-logo');
CREATE POLICY "Allow update empresa-logo" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'empresa-logo') WITH CHECK (bucket_id = 'empresa-logo');
CREATE POLICY "Allow delete empresa-logo" ON storage.objects FOR DELETE TO public USING (bucket_id = 'empresa-logo');