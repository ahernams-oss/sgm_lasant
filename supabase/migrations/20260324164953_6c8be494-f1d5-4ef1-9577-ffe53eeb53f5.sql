
INSERT INTO storage.buckets (id, name, public) VALUES ('exames-aso', 'exames-aso', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Leitura pública ASO" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'exames-aso');
CREATE POLICY "Upload autenticado ASO" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exames-aso');
CREATE POLICY "Delete autenticado ASO" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'exames-aso');
