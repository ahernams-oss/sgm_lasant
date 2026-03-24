ALTER TABLE public.requisicoes 
  ADD COLUMN IF NOT EXISTS headcount text,
  ADD COLUMN IF NOT EXISTS orcamento text,
  ADD COLUMN IF NOT EXISTS tipo_vaga text;