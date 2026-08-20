ALTER TABLE public.cotacao_propostas_externas
  ADD COLUMN IF NOT EXISTS valor_frete numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_operacao numeric NOT NULL DEFAULT 0;