ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS profissionais jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS observacoes jsonb DEFAULT '[]'::jsonb;