
CREATE TABLE public.pregao_anexos_edital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  url TEXT NOT NULL,
  storage_path TEXT,
  tamanho_bytes BIGINT,
  mime_type TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_anexos_edital TO anon, authenticated;
GRANT ALL ON public.pregao_anexos_edital TO service_role;
ALTER TABLE public.pregao_anexos_edital ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_anexos_edital_all" ON public.pregao_anexos_edital FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_anexos_edital_pregao ON public.pregao_anexos_edital(pregao_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('pregao-edital', 'pregao-edital', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "pregao_edital_select" ON storage.objects FOR SELECT USING (bucket_id = 'pregao-edital');
CREATE POLICY "pregao_edital_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pregao-edital');
CREATE POLICY "pregao_edital_update" ON storage.objects FOR UPDATE USING (bucket_id = 'pregao-edital');
CREATE POLICY "pregao_edital_delete" ON storage.objects FOR DELETE USING (bucket_id = 'pregao-edital');
