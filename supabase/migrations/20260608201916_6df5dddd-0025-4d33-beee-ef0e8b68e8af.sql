CREATE TABLE public.funcionario_cliente_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome text,
  data_inicio timestamptz NOT NULL DEFAULT now(),
  data_fim timestamptz,
  justificativa text,
  autorizado_por_email text,
  alterado_por text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_func_cli_hist_func ON public.funcionario_cliente_historico(funcionario_id);
CREATE INDEX idx_func_cli_hist_open ON public.funcionario_cliente_historico(funcionario_id) WHERE data_fim IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionario_cliente_historico TO anon, authenticated;
GRANT ALL ON public.funcionario_cliente_historico TO service_role;

ALTER TABLE public.funcionario_cliente_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público histórico cliente funcionário"
ON public.funcionario_cliente_historico FOR ALL
USING (true) WITH CHECK (true);