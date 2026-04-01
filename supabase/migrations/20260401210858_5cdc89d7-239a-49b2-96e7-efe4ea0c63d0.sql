ALTER TABLE public.lancamentos ADD COLUMN IF NOT EXISTS tipo_advertencia text DEFAULT '';
ALTER TABLE public.lancamentos ADD COLUMN IF NOT EXISTS motivo text DEFAULT '';