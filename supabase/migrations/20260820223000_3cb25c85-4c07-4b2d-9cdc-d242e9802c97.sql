ALTER TABLE public.compras_confirmacoes_valores
  ADD COLUMN IF NOT EXISTS alcada text NOT NULL DEFAULT 'Automática',
  ADD COLUMN IF NOT EXISTS limite_alcada_percentual numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS aprovado_por_alcada text,
  ADD COLUMN IF NOT EXISTS requer_diretoria boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS diretoria_notificada_em timestamptz,
  ADD COLUMN IF NOT EXISTS diretoria_aceite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dias_atraso_aprovacao integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impacto_atraso numeric NOT NULL DEFAULT 0;