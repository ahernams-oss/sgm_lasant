CREATE TABLE public.pmoc_atividades_execucoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atividade_id UUID NOT NULL REFERENCES public.pmoc_atividades(id) ON DELETE CASCADE,
  plano_id UUID,
  equipamento_id UUID,
  equipamento_nome TEXT,
  atividade_descricao TEXT,
  periodicidade TEXT,
  data_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
  proxima_execucao TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pendente',
  registrado_por TEXT,
  confirmado_por TEXT,
  data_confirmacao TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pmoc_atividades_execucoes TO anon, authenticated;
GRANT ALL ON public.pmoc_atividades_execucoes TO service_role;

ALTER TABLE public.pmoc_atividades_execucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público pmoc_atividades_execucoes"
ON public.pmoc_atividades_execucoes
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_pmoc_exec_atividade ON public.pmoc_atividades_execucoes(atividade_id);
CREATE INDEX idx_pmoc_exec_status ON public.pmoc_atividades_execucoes(status);

CREATE TRIGGER trg_pmoc_exec_updated_at
BEFORE UPDATE ON public.pmoc_atividades_execucoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();