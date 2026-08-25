CREATE INDEX IF NOT EXISTS idx_processos_seletivos_created_at_asc ON public.processos_seletivos (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_recebimentos_created_at_asc ON public.recebimentos (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_req_compras_created_at_asc ON public.requisicoes_compras (created_at ASC);
CREATE INDEX IF NOT EXISTS idx_boletins_medicao_ano_numero ON public.boletins_medicao (ano, numero);