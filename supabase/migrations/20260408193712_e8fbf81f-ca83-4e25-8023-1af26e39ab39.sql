ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS anexos_documentos jsonb DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public) VALUES ('funcionarios-anexos', 'funcionarios-anexos', true);

CREATE POLICY "Public read funcionarios-anexos" ON storage.objects FOR SELECT USING (bucket_id = 'funcionarios-anexos');
CREATE POLICY "Public insert funcionarios-anexos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'funcionarios-anexos');
CREATE POLICY "Public update funcionarios-anexos" ON storage.objects FOR UPDATE USING (bucket_id = 'funcionarios-anexos');
CREATE POLICY "Public delete funcionarios-anexos" ON storage.objects FOR DELETE USING (bucket_id = 'funcionarios-anexos');