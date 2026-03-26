ALTER TABLE public.empresa
  ADD COLUMN email_rh text DEFAULT ''::text,
  ADD COLUMN email_engenharia text DEFAULT ''::text,
  ADD COLUMN email_estoque text DEFAULT ''::text,
  ADD COLUMN email_relatorios text DEFAULT ''::text;