ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS data_faturamento date,
  ADD COLUMN IF NOT EXISTS faturado_por text,
  ADD COLUMN IF NOT EXISTS faturado_em timestamptz;