
CREATE TABLE public.funcionario_transferencia_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id uuid NOT NULL,
  funcionario_nome text,
  cliente_atual_id uuid,
  cliente_atual_nome text,
  novo_cliente_id uuid NOT NULL,
  novo_cliente_nome text,
  justificativa text,
  status text NOT NULL DEFAULT 'pendente',
  solicitado_por text,
  solicitado_em timestamptz NOT NULL DEFAULT now(),
  decidido_por text,
  decidido_em timestamptz,
  decisao_observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ftrans_func ON public.funcionario_transferencia_solicitacoes(funcionario_id);
CREATE INDEX idx_ftrans_status ON public.funcionario_transferencia_solicitacoes(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionario_transferencia_solicitacoes TO anon, authenticated;
GRANT ALL ON public.funcionario_transferencia_solicitacoes TO service_role;

ALTER TABLE public.funcionario_transferencia_solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.funcionario_transferencia_solicitacoes
  FOR ALL USING (true) WITH CHECK (true);
