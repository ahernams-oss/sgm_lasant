
INSERT INTO storage.buckets (id, name, public)
VALUES ('financeiro-anexos', 'financeiro-anexos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "financeiro_anexos_select" ON storage.objects FOR SELECT USING (bucket_id = 'financeiro-anexos');
CREATE POLICY "financeiro_anexos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'financeiro-anexos');
CREATE POLICY "financeiro_anexos_update" ON storage.objects FOR UPDATE USING (bucket_id = 'financeiro-anexos');
CREATE POLICY "financeiro_anexos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'financeiro-anexos');
