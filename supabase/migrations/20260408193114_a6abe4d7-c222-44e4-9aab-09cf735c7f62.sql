INSERT INTO storage.buckets (id, name, public) VALUES ('processos-trabalhistas-anexos', 'processos-trabalhistas-anexos', true);

CREATE POLICY "Public read processos-trabalhistas-anexos" ON storage.objects FOR SELECT USING (bucket_id = 'processos-trabalhistas-anexos');
CREATE POLICY "Public insert processos-trabalhistas-anexos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'processos-trabalhistas-anexos');
CREATE POLICY "Public update processos-trabalhistas-anexos" ON storage.objects FOR UPDATE USING (bucket_id = 'processos-trabalhistas-anexos');
CREATE POLICY "Public delete processos-trabalhistas-anexos" ON storage.objects FOR DELETE USING (bucket_id = 'processos-trabalhistas-anexos');