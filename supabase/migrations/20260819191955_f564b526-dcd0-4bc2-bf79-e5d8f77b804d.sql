ALTER TABLE public.nrs_catalogo ADD COLUMN IF NOT EXISTS validade_dias integer;
ALTER TABLE public.nrs_catalogo DROP COLUMN IF EXISTS data_validade;