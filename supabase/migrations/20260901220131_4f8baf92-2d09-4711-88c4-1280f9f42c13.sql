ALTER TABLE public.portal_treinamentos
  ADD COLUMN IF NOT EXISTS assinado_em timestamptz,
  ADD COLUMN IF NOT EXISTS assinatura_ip text,
  ADD COLUMN IF NOT EXISTS assinatura_dispositivo text,
  ADD COLUMN IF NOT EXISTS assinatura_hash text;