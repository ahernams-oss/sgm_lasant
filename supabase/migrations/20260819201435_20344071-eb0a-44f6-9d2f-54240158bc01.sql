ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS conselho_classe text,
  ADD COLUMN IF NOT EXISTS conselho_numero text,
  ADD COLUMN IF NOT EXISTS conselho_data_expedicao date,
  ADD COLUMN IF NOT EXISTS conselho_uf text,
  ADD COLUMN IF NOT EXISTS conselho_anexos jsonb NOT NULL DEFAULT '[]'::jsonb;