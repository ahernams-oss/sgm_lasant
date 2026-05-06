ALTER TABLE public.empresa
  ADD COLUMN IF NOT EXISTS whatsapp_compras text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS whatsapp_rh text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS whatsapp_engenharia text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS whatsapp_comercial text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS whatsapp_faturamento text DEFAULT ''::text;