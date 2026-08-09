
-- avaliacoes_desempenho
DROP POLICY IF EXISTS "Public delete avaliacoes_desempenho" ON public.avaliacoes_desempenho;
DROP POLICY IF EXISTS "Public insert avaliacoes_desempenho" ON public.avaliacoes_desempenho;
DROP POLICY IF EXISTS "Public read avaliacoes_desempenho" ON public.avaliacoes_desempenho;
DROP POLICY IF EXISTS "Public update avaliacoes_desempenho" ON public.avaliacoes_desempenho;
CREATE POLICY "Authenticated manage avaliacoes_desempenho" ON public.avaliacoes_desempenho FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.avaliacoes_desempenho FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avaliacoes_desempenho TO authenticated;
GRANT ALL ON public.avaliacoes_desempenho TO service_role;

-- contrato_transferencias_saldo
DROP POLICY IF EXISTS "Todos podem atualizar transferencias saldo" ON public.contrato_transferencias_saldo;
DROP POLICY IF EXISTS "Todos podem deletar transferencias saldo" ON public.contrato_transferencias_saldo;
DROP POLICY IF EXISTS "Todos podem inserir transferencias saldo" ON public.contrato_transferencias_saldo;
DROP POLICY IF EXISTS "Todos podem ler transferencias saldo" ON public.contrato_transferencias_saldo;
CREATE POLICY "Authenticated manage transferencias saldo" ON public.contrato_transferencias_saldo FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.contrato_transferencias_saldo FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_transferencias_saldo TO authenticated;
GRANT ALL ON public.contrato_transferencias_saldo TO service_role;

-- contratos_terceiros
DROP POLICY IF EXISTS "contratos_terceiros_all" ON public.contratos_terceiros;
CREATE POLICY "contratos_terceiros_authenticated" ON public.contratos_terceiros FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.contratos_terceiros FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_terceiros TO authenticated;
GRANT ALL ON public.contratos_terceiros TO service_role;

-- funcionario_cliente_historico
DROP POLICY IF EXISTS "Acesso público histórico cliente funcionário" ON public.funcionario_cliente_historico;
CREATE POLICY "Authenticated manage historico cliente funcionario" ON public.funcionario_cliente_historico FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.funcionario_cliente_historico FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionario_cliente_historico TO authenticated;
GRANT ALL ON public.funcionario_cliente_historico TO service_role;

-- funcionario_transferencia_solicitacoes
DROP POLICY IF EXISTS "Public access" ON public.funcionario_transferencia_solicitacoes;
CREATE POLICY "Authenticated manage transferencia solicitacoes" ON public.funcionario_transferencia_solicitacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.funcionario_transferencia_solicitacoes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcionario_transferencia_solicitacoes TO authenticated;
GRANT ALL ON public.funcionario_transferencia_solicitacoes TO service_role;

-- juridico_parcelas
DROP POLICY IF EXISTS "public_all_juridico_parcelas" ON public.juridico_parcelas;
CREATE POLICY "authenticated_all_juridico_parcelas" ON public.juridico_parcelas FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.juridico_parcelas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.juridico_parcelas TO authenticated;
GRANT ALL ON public.juridico_parcelas TO service_role;

-- user_grid_column_prefs
DROP POLICY IF EXISTS "Public delete user_grid_column_prefs" ON public.user_grid_column_prefs;
DROP POLICY IF EXISTS "Public insert user_grid_column_prefs" ON public.user_grid_column_prefs;
DROP POLICY IF EXISTS "Public read user_grid_column_prefs" ON public.user_grid_column_prefs;
DROP POLICY IF EXISTS "Public update user_grid_column_prefs" ON public.user_grid_column_prefs;
CREATE POLICY "Authenticated manage user_grid_column_prefs" ON public.user_grid_column_prefs FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.user_grid_column_prefs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_grid_column_prefs TO authenticated;
GRANT ALL ON public.user_grid_column_prefs TO service_role;

-- whatsapp_campanhas
DROP POLICY IF EXISTS "public delete whatsapp_campanhas" ON public.whatsapp_campanhas;
DROP POLICY IF EXISTS "public insert whatsapp_campanhas" ON public.whatsapp_campanhas;
DROP POLICY IF EXISTS "public read whatsapp_campanhas" ON public.whatsapp_campanhas;
DROP POLICY IF EXISTS "public update whatsapp_campanhas" ON public.whatsapp_campanhas;
CREATE POLICY "Authenticated manage whatsapp_campanhas" ON public.whatsapp_campanhas FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.whatsapp_campanhas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_campanhas TO authenticated;
GRANT ALL ON public.whatsapp_campanhas TO service_role;

-- whatsapp_envios
DROP POLICY IF EXISTS "public delete whatsapp_envios" ON public.whatsapp_envios;
DROP POLICY IF EXISTS "public insert whatsapp_envios" ON public.whatsapp_envios;
DROP POLICY IF EXISTS "public read whatsapp_envios" ON public.whatsapp_envios;
CREATE POLICY "Authenticated manage whatsapp_envios" ON public.whatsapp_envios FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.whatsapp_envios FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_envios TO authenticated;
GRANT ALL ON public.whatsapp_envios TO service_role;
