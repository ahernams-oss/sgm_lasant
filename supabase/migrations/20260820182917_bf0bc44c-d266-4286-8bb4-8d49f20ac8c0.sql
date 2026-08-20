CREATE TABLE public.epis_devolucoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL,
  epi_item_id TEXT,
  codigo TEXT,
  descricao TEXT NOT NULL,
  ca TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  data_entrega DATE,
  data_devolucao DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo TEXT NOT NULL DEFAULT 'Desgaste',
  condicao TEXT,
  destino TEXT,
  observacao TEXT,
  anexo_path TEXT,
  registrado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis_devolucoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis_devolucoes TO anon;
GRANT ALL ON public.epis_devolucoes TO service_role;

ALTER TABLE public.epis_devolucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epis_devolucoes_all" ON public.epis_devolucoes FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_epis_devolucoes_func ON public.epis_devolucoes (funcionario_id, data_devolucao DESC);

CREATE TRIGGER trg_epis_devolucoes_updated
BEFORE UPDATE ON public.epis_devolucoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();