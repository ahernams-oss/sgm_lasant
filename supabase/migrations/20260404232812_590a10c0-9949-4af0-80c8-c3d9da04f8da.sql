ALTER TABLE public.medicoes_servicos ADD COLUMN IF NOT EXISTS valor_lasant numeric DEFAULT 0;
ALTER TABLE public.medicoes_servicos ADD COLUMN IF NOT EXISTS valor_empreiteiro numeric DEFAULT 0;