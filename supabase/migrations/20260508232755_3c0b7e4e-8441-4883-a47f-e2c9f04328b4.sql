
INSERT INTO storage.buckets (id, name, public) VALUES ('medicoes-anexos', 'medicoes-anexos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read medicoes-anexos" ON storage.objects FOR SELECT USING (bucket_id = 'medicoes-anexos');
CREATE POLICY "Public insert medicoes-anexos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medicoes-anexos');
CREATE POLICY "Public update medicoes-anexos" ON storage.objects FOR UPDATE USING (bucket_id = 'medicoes-anexos');
CREATE POLICY "Public delete medicoes-anexos" ON storage.objects FOR DELETE USING (bucket_id = 'medicoes-anexos');
