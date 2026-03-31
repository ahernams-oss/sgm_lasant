ALTER TABLE public.solicitacoes_servicos 
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'Predial',
  ADD COLUMN IF NOT EXISTS imagens jsonb DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('solicitacoes-imagens', 'solicitacoes-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read solicitacoes-imagens" ON storage.objects
  FOR SELECT USING (bucket_id = 'solicitacoes-imagens');

CREATE POLICY "Allow public insert solicitacoes-imagens" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'solicitacoes-imagens');

CREATE POLICY "Allow public update solicitacoes-imagens" ON storage.objects
  FOR UPDATE USING (bucket_id = 'solicitacoes-imagens');

CREATE POLICY "Allow public delete solicitacoes-imagens" ON storage.objects
  FOR DELETE USING (bucket_id = 'solicitacoes-imagens');