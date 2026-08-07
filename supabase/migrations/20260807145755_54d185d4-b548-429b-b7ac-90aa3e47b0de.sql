DROP INDEX IF EXISTS public.processos_seletivos_requisicao_id_key;
CREATE UNIQUE INDEX processos_seletivos_requisicao_id_key
  ON public.processos_seletivos USING btree (requisicao_id);