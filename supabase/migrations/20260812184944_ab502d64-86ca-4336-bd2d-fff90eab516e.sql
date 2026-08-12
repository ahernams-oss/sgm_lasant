ALTER TABLE public.nfes_recebidas
  ADD COLUMN IF NOT EXISTS conta_pagar_id uuid REFERENCES public.fin_contas_pagar(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS rejeitada_em timestamptz;

ALTER TABLE public.nfses_tomadas
  ADD COLUMN IF NOT EXISTS conta_pagar_id uuid REFERENCES public.fin_contas_pagar(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS rejeitada_em timestamptz,
  ADD COLUMN IF NOT EXISTS nfe_id uuid;

ALTER TABLE public.nfses_tomadas DROP COLUMN IF EXISTS nfe_id;