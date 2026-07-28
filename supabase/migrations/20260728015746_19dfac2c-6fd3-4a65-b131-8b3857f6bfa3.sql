
CREATE TABLE IF NOT EXISTS public.portal_solicitacoes_rh (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id TEXT NOT NULL,
  cpf TEXT NOT NULL,
  tipo TEXT NOT NULL,
  assunto TEXT NOT NULL,
  descricao TEXT,
  anexo_path TEXT,
  anexo_nome TEXT,
  status TEXT NOT NULL DEFAULT 'aberta',
  resposta_rh TEXT,
  respondido_por TEXT,
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_solicitacoes_rh_funcionario ON public.portal_solicitacoes_rh(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_portal_solicitacoes_rh_status ON public.portal_solicitacoes_rh(status);

GRANT ALL ON public.portal_solicitacoes_rh TO service_role;

ALTER TABLE public.portal_solicitacoes_rh ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitacoes_rh_service_only" ON public.portal_solicitacoes_rh
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_portal_solicitacoes_rh_updated
BEFORE UPDATE ON public.portal_solicitacoes_rh
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
