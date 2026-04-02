ALTER TABLE public.solicitacoes_servicos ADD COLUMN IF NOT EXISTS historico jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS historico jsonb DEFAULT '[]'::jsonb;