ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS avaliacao integer,
  ADD COLUMN IF NOT EXISTS avaliacao_justificativa text DEFAULT '',
  ADD COLUMN IF NOT EXISTS avaliacao_data timestamp with time zone,
  ADD COLUMN IF NOT EXISTS avaliacao_usuario text DEFAULT '';