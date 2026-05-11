
-- Helpers já existem (update_updated_at_column)

CREATE TABLE public.fin_contas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  banco text,
  agencia text,
  conta text,
  tipo text NOT NULL DEFAULT 'corrente',
  saldo_inicial numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_plano_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text,
  nome text NOT NULL,
  tipo text NOT NULL,
  parent_id uuid REFERENCES public.fin_plano_contas(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text,
  nome text NOT NULL,
  cliente_id uuid,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  fornecedor_id uuid,
  fornecedor_nome text,
  valor_total numeric NOT NULL DEFAULT 0,
  valor_pago numeric NOT NULL DEFAULT 0,
  data_emissao date,
  data_vencimento date NOT NULL,
  data_pagamento date,
  conta_bancaria_id uuid REFERENCES public.fin_contas_bancarias(id) ON DELETE SET NULL,
  plano_conta_id uuid REFERENCES public.fin_plano_contas(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aberta',
  parcela_num int NOT NULL DEFAULT 1,
  parcela_total int NOT NULL DEFAULT 1,
  recorrencia jsonb,
  anexo_url text,
  anexo_nome text,
  observacao text,
  pedido_compra_id uuid,
  origem text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  cliente_id uuid,
  cliente_nome text,
  valor_total numeric NOT NULL DEFAULT 0,
  valor_recebido numeric NOT NULL DEFAULT 0,
  data_emissao date,
  data_vencimento date NOT NULL,
  data_recebimento date,
  conta_bancaria_id uuid REFERENCES public.fin_contas_bancarias(id) ON DELETE SET NULL,
  plano_conta_id uuid REFERENCES public.fin_plano_contas(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aberta',
  parcela_num int NOT NULL DEFAULT 1,
  parcela_total int NOT NULL DEFAULT 1,
  anexo_url text,
  anexo_nome text,
  observacao text,
  contrato_id uuid,
  faturamento_id uuid,
  origem text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  conta_bancaria_id uuid NOT NULL REFERENCES public.fin_contas_bancarias(id) ON DELETE CASCADE,
  conta_destino_id uuid REFERENCES public.fin_contas_bancarias(id) ON DELETE SET NULL,
  valor numeric NOT NULL,
  data date NOT NULL,
  descricao text,
  conta_pagar_id uuid REFERENCES public.fin_contas_pagar(id) ON DELETE SET NULL,
  conta_receber_id uuid REFERENCES public.fin_contas_receber(id) ON DELETE SET NULL,
  plano_conta_id uuid REFERENCES public.fin_plano_contas(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  conciliado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fin_movimentos_ofx (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_bancaria_id uuid NOT NULL REFERENCES public.fin_contas_bancarias(id) ON DELETE CASCADE,
  fitid text NOT NULL,
  data date NOT NULL,
  valor numeric NOT NULL,
  descricao text,
  conciliado boolean NOT NULL DEFAULT false,
  lancamento_id uuid REFERENCES public.fin_lancamentos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conta_bancaria_id, fitid)
);

-- RLS pública (segue padrão do projeto)
ALTER TABLE public.fin_contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_plano_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_movimentos_ofx ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'fin_contas_bancarias','fin_plano_contas','fin_centros_custo',
    'fin_contas_pagar','fin_contas_receber','fin_lancamentos','fin_movimentos_ofx'
  ] LOOP
    EXECUTE format('CREATE POLICY "public_select_%1$s" ON public.%1$I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "public_insert_%1$s" ON public.%1$I FOR INSERT WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "public_update_%1$s" ON public.%1$I FOR UPDATE USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "public_delete_%1$s" ON public.%1$I FOR DELETE USING (true)', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

CREATE INDEX idx_fin_cp_venc ON public.fin_contas_pagar(data_vencimento);
CREATE INDEX idx_fin_cp_status ON public.fin_contas_pagar(status);
CREATE INDEX idx_fin_cp_pc ON public.fin_contas_pagar(pedido_compra_id);
CREATE INDEX idx_fin_cr_venc ON public.fin_contas_receber(data_vencimento);
CREATE INDEX idx_fin_cr_status ON public.fin_contas_receber(status);
CREATE INDEX idx_fin_cr_fat ON public.fin_contas_receber(faturamento_id);
CREATE INDEX idx_fin_lanc_data ON public.fin_lancamentos(data);
CREATE INDEX idx_fin_lanc_conta ON public.fin_lancamentos(conta_bancaria_id);
