ALTER TABLE public.portal_treinamentos
  ADD COLUMN IF NOT EXISTS resp_assinado_em timestamptz,
  ADD COLUMN IF NOT EXISTS resp_assinante_nome text,
  ADD COLUMN IF NOT EXISTS resp_assinante_cargo text,
  ADD COLUMN IF NOT EXISTS resp_assinatura_hash text;