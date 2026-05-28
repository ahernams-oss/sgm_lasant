
-- Tabela de férias dos funcionários
CREATE TABLE public.ferias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id TEXT NOT NULL,
  funcionario_nome TEXT,
  periodo_aquisitivo_inicio DATE NOT NULL,
  periodo_aquisitivo_fim DATE NOT NULL,
  data_limite_concessao DATE NOT NULL,
  dias_direito INTEGER NOT NULL DEFAULT 30,
  data_inicio_gozo DATE,
  data_fim_gozo DATE,
  dias_gozados INTEGER DEFAULT 0,
  dias_abonados INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'A vencer',
  observacoes TEXT,
  anexo_url TEXT,
  anexo_nome TEXT,
  notificado_60d BOOLEAN DEFAULT false,
  notificado_30d BOOLEAN DEFAULT false,
  notificado_vencida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferias TO authenticated;
GRANT ALL ON public.ferias TO service_role;

ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público às férias" ON public.ferias FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_ferias_funcionario ON public.ferias(funcionario_id);
CREATE INDEX idx_ferias_limite ON public.ferias(data_limite_concessao);

CREATE TRIGGER update_ferias_updated_at
BEFORE UPDATE ON public.ferias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para comprovantes de férias
INSERT INTO storage.buckets (id, name, public) VALUES ('ferias-comprovantes', 'ferias-comprovantes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Comprovantes férias - leitura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'ferias-comprovantes');

CREATE POLICY "Comprovantes férias - upload público"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ferias-comprovantes');

CREATE POLICY "Comprovantes férias - update público"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ferias-comprovantes');

CREATE POLICY "Comprovantes férias - delete público"
ON storage.objects FOR DELETE
USING (bucket_id = 'ferias-comprovantes');
