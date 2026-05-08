ALTER TABLE public.orcamentos
ADD COLUMN IF NOT EXISTS criado_por text DEFAULT '',
ADD COLUMN IF NOT EXISTS data_criacao timestamptz;