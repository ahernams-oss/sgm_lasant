ALTER TABLE public.portal_holerites_import_item
  ADD COLUMN IF NOT EXISTS salario_base numeric,
  ADD COLUMN IF NOT EXISTS horas_trabalhadas numeric,
  ADD COLUMN IF NOT EXISTS horas_extras numeric,
  ADD COLUMN IF NOT EXISTS valor_horas_extras numeric,
  ADD COLUMN IF NOT EXISTS total_descontos numeric,
  ADD COLUMN IF NOT EXISTS total_proventos numeric;