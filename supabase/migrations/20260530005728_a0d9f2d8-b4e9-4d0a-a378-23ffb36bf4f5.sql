ALTER TABLE public.licitacoes_analises
  ADD COLUMN IF NOT EXISTS analise_ia_markdown text,
  ADD COLUMN IF NOT EXISTS analise_ia_gerada_em timestamptz;