ALTER TABLE public.medicoes_servicos ADD COLUMN IF NOT EXISTS ordem_compra_id text DEFAULT '';
ALTER TABLE public.medicoes_servicos ADD COLUMN IF NOT EXISTS ordem_compra_numero integer DEFAULT 0;