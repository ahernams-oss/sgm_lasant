ALTER TABLE public.processos_trabalhistas
  ADD COLUMN IF NOT EXISTS advogados_empresa jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preposto text;

UPDATE public.processos_trabalhistas
SET advogados_empresa = to_jsonb(ARRAY[advogado_empresa])
WHERE COALESCE(advogado_empresa, '') <> ''
  AND advogados_empresa = '[]'::jsonb;