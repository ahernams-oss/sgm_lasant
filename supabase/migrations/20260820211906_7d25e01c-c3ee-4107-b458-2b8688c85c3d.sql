CREATE TABLE public.compras_confirmacoes_valores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cotacao_id TEXT,
  requisicao_id TEXT,
  requisicao_numero INTEGER,
  pedido_id TEXT,
  fornecedor_id TEXT,
  fornecedor_nome TEXT,
  item_id TEXT,
  descricao TEXT,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  unidade_medida TEXT,
  preco_aprovado NUMERIC NOT NULL DEFAULT 0,
  preco_confirmado NUMERIC NOT NULL DEFAULT 0,
  valor_aprovado NUMERIC NOT NULL DEFAULT 0,
  valor_confirmado NUMERIC NOT NULL DEFAULT 0,
  variacao_valor NUMERIC NOT NULL DEFAULT 0,
  variacao_percentual NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'Cost Avoidance',
  justificativa TEXT,
  confirmado_por TEXT,
  confirmado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_confirmacoes_valores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compras_confirmacoes_valores TO anon;
GRANT ALL ON public.compras_confirmacoes_valores TO service_role;

ALTER TABLE public.compras_confirmacoes_valores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso publico confirmacoes valores"
ON public.compras_confirmacoes_valores
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_conf_valores_cotacao ON public.compras_confirmacoes_valores (cotacao_id);
CREATE INDEX idx_conf_valores_data ON public.compras_confirmacoes_valores (confirmado_em);

CREATE TRIGGER trg_conf_valores_updated
BEFORE UPDATE ON public.compras_confirmacoes_valores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();