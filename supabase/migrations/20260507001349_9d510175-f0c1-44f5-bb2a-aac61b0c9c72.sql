-- Permitir múltiplas referências (mês/ano) no catálogo SCO
ALTER TABLE public.sco_elementares DROP CONSTRAINT IF EXISTS sco_elementares_pkey;
ALTER TABLE public.sco_elementares DROP CONSTRAINT IF EXISTS sco_elementares_codigo_key;
ALTER TABLE public.sco_elementares ALTER COLUMN referencia SET NOT NULL;
ALTER TABLE public.sco_elementares ADD CONSTRAINT sco_elementares_codigo_ref_key UNIQUE (codigo, referencia);

ALTER TABLE public.sco_servicos DROP CONSTRAINT IF EXISTS sco_servicos_pkey;
ALTER TABLE public.sco_servicos DROP CONSTRAINT IF EXISTS sco_servicos_codigo_key;
ALTER TABLE public.sco_servicos ALTER COLUMN referencia SET NOT NULL;
ALTER TABLE public.sco_servicos ADD CONSTRAINT sco_servicos_codigo_ref_key UNIQUE (codigo, referencia);

ALTER TABLE public.sco_composicoes ADD COLUMN IF NOT EXISTS referencia text NOT NULL DEFAULT 'Março/2026';
CREATE INDEX IF NOT EXISTS idx_sco_composicoes_serv_ref ON public.sco_composicoes (servico_codigo, referencia);

ALTER TABLE public.orcamentos_sco ADD COLUMN IF NOT EXISTS referencia text;