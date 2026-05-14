ALTER TABLE public.empresa
  ADD COLUMN IF NOT EXISTS certificado_a1_cnpj text,
  ADD COLUMN IF NOT EXISTS certificado_a1_titular text,
  ADD COLUMN IF NOT EXISTS certificado_a1_emissor text,
  ADD COLUMN IF NOT EXISTS certificado_a1_validado_em timestamptz,
  ADD COLUMN IF NOT EXISTS certificado_a1_status text;