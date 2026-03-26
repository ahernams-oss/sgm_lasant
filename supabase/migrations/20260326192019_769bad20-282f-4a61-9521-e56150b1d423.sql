
ALTER TABLE public.estoque_movimentacoes 
  ADD COLUMN IF NOT EXISTS lote text DEFAULT '',
  ADD COLUMN IF NOT EXISTS validade date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deposito_origem text DEFAULT '',
  ADD COLUMN IF NOT EXISTS deposito_destino text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fornecedor_nome text DEFAULT '';
