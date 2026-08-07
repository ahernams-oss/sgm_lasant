ALTER TABLE public.solicitacoes_servicos
  ADD COLUMN IF NOT EXISTS impresso boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS impresso_em timestamptz,
  ADD COLUMN IF NOT EXISTS impresso_por text;

ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS impresso boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS impresso_em timestamptz,
  ADD COLUMN IF NOT EXISTS impresso_por text;