ALTER TABLE public.lancamentos
  ADD COLUMN IF NOT EXISTS unidade_he text,
  ADD COLUMN IF NOT EXISTS valor_va numeric,
  ADD COLUMN IF NOT EXISTS valor_vt numeric;