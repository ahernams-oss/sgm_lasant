ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS contrato_numero text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS processo_numero text DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS valor_total_contrato numeric DEFAULT 0;