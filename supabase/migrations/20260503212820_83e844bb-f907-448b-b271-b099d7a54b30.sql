CREATE TABLE public.cronogramas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  cliente_id TEXT NOT NULL DEFAULT '',
  cliente_nome TEXT NOT NULL DEFAULT '',
  obra TEXT NOT NULL DEFAULT '',
  descricao TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  data_inicio DATE,
  data_fim DATE,
  granularidade TEXT NOT NULL DEFAULT 'mensal',
  valor_total NUMERIC DEFAULT 0,
  atividades JSONB NOT NULL DEFAULT '[]'::jsonb,
  periodos JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'Em Andamento',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cronogramas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all cronogramas" ON public.cronogramas FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_cronogramas_updated_at
BEFORE UPDATE ON public.cronogramas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();