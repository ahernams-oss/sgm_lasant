CREATE INDEX IF NOT EXISTS idx_nfes_recebidas_conta_pagar ON public.nfes_recebidas (conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_nfses_tomadas_conta_pagar ON public.nfses_tomadas (conta_pagar_id);
ANALYZE public.nfes_recebidas;
ANALYZE public.nfses_tomadas;