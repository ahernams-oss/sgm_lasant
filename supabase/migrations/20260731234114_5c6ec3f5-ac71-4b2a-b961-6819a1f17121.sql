ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS escolaridade text,
  ADD COLUMN IF NOT EXISTS curso_formacao text,
  ADD COLUMN IF NOT EXISTS contatos_emergencia jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pensao_alimenticia jsonb NOT NULL DEFAULT '{}'::jsonb;