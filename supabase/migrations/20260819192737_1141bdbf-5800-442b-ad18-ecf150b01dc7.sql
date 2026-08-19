ALTER TABLE public.nrs_catalogo
  ADD COLUMN IF NOT EXISTS observacao text,
  ADD COLUMN IF NOT EXISTS data_publicacao date,
  ADD COLUMN IF NOT EXISTS data_vigencia date,
  ADD COLUMN IF NOT EXISTS revisoes jsonb NOT NULL DEFAULT '[]'::jsonb;