CREATE TABLE public.nfses_tomadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  chave TEXT NOT NULL UNIQUE,
  numero TEXT,
  serie TEXT,
  codigo_verificacao TEXT,
  prestador_cnpj TEXT,
  prestador_nome TEXT,
  tomador_cnpj TEXT,
  valor_servicos NUMERIC(14,2),
  valor_iss NUMERIC(14,2),
  base_calculo NUMERIC(14,2),
  valor_total NUMERIC(14,2),
  discriminacao TEXT,
  municipio_prestacao TEXT,
  data_emissao TIMESTAMPTZ,
  data_recebimento TIMESTAMPTZ,
  ambiente TEXT,
  status TEXT,
  origem TEXT DEFAULT 'focus',
  xml_url TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfses_tomadas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfses_tomadas TO authenticated;
GRANT ALL ON public.nfses_tomadas TO service_role;

ALTER TABLE public.nfses_tomadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read nfses_tomadas" ON public.nfses_tomadas FOR SELECT USING (true);
CREATE POLICY "public insert nfses_tomadas" ON public.nfses_tomadas FOR INSERT WITH CHECK (true);
CREATE POLICY "public update nfses_tomadas" ON public.nfses_tomadas FOR UPDATE USING (true);
CREATE POLICY "public delete nfses_tomadas" ON public.nfses_tomadas FOR DELETE USING (true);

CREATE INDEX idx_nfses_tomadas_empresa ON public.nfses_tomadas(empresa_id);
CREATE INDEX idx_nfses_tomadas_data ON public.nfses_tomadas(data_emissao DESC);
CREATE INDEX idx_nfses_tomadas_prestador ON public.nfses_tomadas(prestador_cnpj);

CREATE TRIGGER trg_nfses_tomadas_updated_at
BEFORE UPDATE ON public.nfses_tomadas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();