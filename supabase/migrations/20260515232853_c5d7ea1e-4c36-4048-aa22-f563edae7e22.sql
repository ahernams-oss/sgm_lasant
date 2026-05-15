
ALTER TABLE public.fin_contas_pagar
  ADD COLUMN IF NOT EXISTS juridico_parcela_id uuid;

CREATE INDEX IF NOT EXISTS idx_fin_cp_juridico_parcela
  ON public.fin_contas_pagar(juridico_parcela_id);
