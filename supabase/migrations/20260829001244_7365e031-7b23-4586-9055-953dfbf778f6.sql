CREATE TABLE IF NOT EXISTS public.ferias_relatorio_envios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destinatario text NOT NULL,
  motivo text,
  status text NOT NULL DEFAULT 'pendente',
  erro text,
  pdf_url text,
  excel_url text,
  resumo jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ferias_relatorio_envios TO authenticated, anon;
GRANT ALL ON public.ferias_relatorio_envios TO service_role;

ALTER TABLE public.ferias_relatorio_envios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ferias_relatorio_envios_read" ON public.ferias_relatorio_envios;
CREATE POLICY "ferias_relatorio_envios_read" ON public.ferias_relatorio_envios FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "ferias_relatorio_envios_insert" ON public.ferias_relatorio_envios;
CREATE POLICY "ferias_relatorio_envios_insert" ON public.ferias_relatorio_envios FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "ferias_relatorio_envios_update" ON public.ferias_relatorio_envios;
CREATE POLICY "ferias_relatorio_envios_update" ON public.ferias_relatorio_envios FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ferias_relatorio_envios_created_at ON public.ferias_relatorio_envios (created_at DESC);

DROP POLICY IF EXISTS "relatorios_ferias_read" ON storage.objects;
CREATE POLICY "relatorios_ferias_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'relatorios-ferias');
DROP POLICY IF EXISTS "relatorios_ferias_insert" ON storage.objects;
CREATE POLICY "relatorios_ferias_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'relatorios-ferias');
DROP POLICY IF EXISTS "relatorios_ferias_update" ON storage.objects;
CREATE POLICY "relatorios_ferias_update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'relatorios-ferias') WITH CHECK (bucket_id = 'relatorios-ferias');