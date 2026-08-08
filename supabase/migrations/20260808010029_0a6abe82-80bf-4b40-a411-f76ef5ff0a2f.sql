-- Helpers para leitura de cabeçalhos da requisição
CREATE OR REPLACE FUNCTION public.req_header(_name text)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.headers', true), '')::json ->> _name
$$;

-- 1) Jurídico: pagamentos de decisões (dados bancários / PIX)
DROP POLICY IF EXISTS "public_all_juridico_decisoes" ON public.juridico_decisoes_pagamentos;
CREATE POLICY "juridico_decisoes_auth_all" ON public.juridico_decisoes_pagamentos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.juridico_decisoes_pagamentos FROM anon;

-- 2) Importação de holerites
DROP POLICY IF EXISTS "lote all" ON public.portal_holerites_import_lote;
DROP POLICY IF EXISTS "item all" ON public.portal_holerites_import_item;
CREATE POLICY "holerites_lote_auth_all" ON public.portal_holerites_import_lote
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "holerites_item_auth_all" ON public.portal_holerites_import_item
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.portal_holerites_import_lote FROM anon;
REVOKE ALL ON public.portal_holerites_import_item FROM anon;

-- 3) Responsáveis técnicos (CPF / CREA)
DROP POLICY IF EXISTS "rt_select" ON public.responsaveis_tecnicos;
DROP POLICY IF EXISTS "rt_insert" ON public.responsaveis_tecnicos;
DROP POLICY IF EXISTS "rt_update" ON public.responsaveis_tecnicos;
DROP POLICY IF EXISTS "rt_delete" ON public.responsaveis_tecnicos;
CREATE POLICY "rt_auth_all" ON public.responsaveis_tecnicos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.responsaveis_tecnicos FROM anon;

-- 4) Recebimentos de EPI (selfies / CPF) - fluxo público usa edge function (service role)
DROP POLICY IF EXISTS "Anon pode ler token" ON public.epis_recebimentos;
DROP POLICY IF EXISTS "Anon pode inserir recebimentos" ON public.epis_recebimentos;
DROP POLICY IF EXISTS "Anon pode atualizar recebimentos" ON public.epis_recebimentos;
REVOKE ALL ON public.epis_recebimentos FROM anon;

-- 5) Cotações: convites e propostas escopados por token / fornecedor
DROP POLICY IF EXISTS "Leitura pública por token" ON public.cotacao_convites;
DROP POLICY IF EXISTS "Update público por token" ON public.cotacao_convites;
DROP POLICY IF EXISTS "Inserção pública de convites" ON public.cotacao_convites;

CREATE POLICY "convite_anon_select_por_token" ON public.cotacao_convites
  FOR SELECT TO anon USING (
    token = public.req_header('x-cotacao-token')
    OR fornecedor_id::text = public.req_header('x-fornecedor-id')
  );

CREATE POLICY "convite_anon_update_por_token" ON public.cotacao_convites
  FOR UPDATE TO anon USING (
    token = public.req_header('x-cotacao-token')
    OR fornecedor_id::text = public.req_header('x-fornecedor-id')
  ) WITH CHECK (
    token = public.req_header('x-cotacao-token')
    OR fornecedor_id::text = public.req_header('x-fornecedor-id')
  );

DROP POLICY IF EXISTS "Leitura pública de propostas" ON public.cotacao_propostas_externas;
DROP POLICY IF EXISTS "Inserção pública de propostas" ON public.cotacao_propostas_externas;

CREATE POLICY "proposta_anon_select_por_token" ON public.cotacao_propostas_externas
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.cotacao_convites c
      WHERE c.id = cotacao_propostas_externas.convite_id
        AND c.token = public.req_header('x-cotacao-token')
    )
  );

CREATE POLICY "proposta_anon_insert_por_token" ON public.cotacao_propostas_externas
  FOR INSERT TO anon WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cotacao_convites c
      WHERE c.id = cotacao_propostas_externas.convite_id
        AND c.token = public.req_header('x-cotacao-token')
        AND c.status NOT IN ('respondido','recusado')
        AND c.expires_at > now()
    )
  );

CREATE POLICY "proposta_auth_all" ON public.cotacao_propostas_externas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6) Pregão: lances públicos para leitura/registro, mas sem adulteração;
--    propostas iniciais e fechadas somente para usuários autenticados
DROP POLICY IF EXISTS "pregao_lances_all" ON public.pregao_lances;
CREATE POLICY "pregao_lances_select" ON public.pregao_lances
  FOR SELECT USING (true);
CREATE POLICY "pregao_lances_insert" ON public.pregao_lances
  FOR INSERT WITH CHECK (true);
CREATE POLICY "pregao_lances_update_auth" ON public.pregao_lances
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pregao_lances_delete_auth" ON public.pregao_lances
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "pregao_prop_ini_all" ON public.pregao_propostas_iniciais;
CREATE POLICY "pregao_prop_ini_auth_all" ON public.pregao_propostas_iniciais
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.pregao_propostas_iniciais FROM anon;

CREATE POLICY "pregao_prop_fechadas_auth_all" ON public.pregao_propostas_fechadas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.pregao_propostas_fechadas FROM anon;