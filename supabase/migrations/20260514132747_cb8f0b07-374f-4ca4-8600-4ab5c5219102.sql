
ALTER TABLE public.empresa
  ADD COLUMN IF NOT EXISTS certificado_a1_url TEXT,
  ADD COLUMN IF NOT EXISTS certificado_a1_nome TEXT,
  ADD COLUMN IF NOT EXISTS certificado_a1_validade DATE,
  ADD COLUMN IF NOT EXISTS certificado_a1_senha TEXT,
  ADD COLUMN IF NOT EXISTS nfe_ambiente TEXT DEFAULT 'homologacao',
  ADD COLUMN IF NOT EXISTS nfe_uf_autor TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados-digitais', 'certificados-digitais', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket privado: políticas permissivas para o app público (auth custom)
-- Apenas o app autenticado e edge functions com service_role podem ler/gravar
CREATE POLICY "Certificados - leitura pública do app"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificados-digitais');

CREATE POLICY "Certificados - upload pelo app"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificados-digitais');

CREATE POLICY "Certificados - update pelo app"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'certificados-digitais');

CREATE POLICY "Certificados - delete pelo app"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'certificados-digitais');
