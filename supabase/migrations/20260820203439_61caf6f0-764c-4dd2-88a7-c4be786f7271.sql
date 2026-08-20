ALTER TABLE public.cotacao_propostas_externas
  ADD COLUMN IF NOT EXISTS valor_seguro numeric NOT NULL DEFAULT 0;