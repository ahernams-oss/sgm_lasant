
CREATE POLICY "memoria_calculo_imagens_select" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'memoria-calculo-imagens');
CREATE POLICY "memoria_calculo_imagens_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'memoria-calculo-imagens');
CREATE POLICY "memoria_calculo_imagens_update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'memoria-calculo-imagens');
CREATE POLICY "memoria_calculo_imagens_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'memoria-calculo-imagens');
