-- Performance indexes for production readiness

-- materiais_servicos
CREATE INDEX IF NOT EXISTS idx_materiais_servicos_codigo ON public.materiais_servicos (codigo);
CREATE INDEX IF NOT EXISTS idx_materiais_servicos_tipo ON public.materiais_servicos (tipo);
CREATE INDEX IF NOT EXISTS idx_materiais_servicos_categoria ON public.materiais_servicos (categoria_id);

-- estoque_movimentacoes
CREATE INDEX IF NOT EXISTS idx_estoque_mov_material ON public.estoque_movimentacoes (material_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_tipo ON public.estoque_movimentacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_deposito_origem ON public.estoque_movimentacoes (deposito_origem);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_deposito_destino ON public.estoque_movimentacoes (deposito_destino);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_created_at ON public.estoque_movimentacoes (created_at DESC);

-- comunicacao_avisos_leitura
CREATE INDEX IF NOT EXISTS idx_avisos_leitura_aviso ON public.comunicacao_avisos_leitura (aviso_id);
CREATE INDEX IF NOT EXISTS idx_avisos_leitura_email ON public.comunicacao_avisos_leitura (usuario_email);

-- recebimentos
CREATE INDEX IF NOT EXISTS idx_recebimentos_created_at ON public.recebimentos (created_at DESC);

-- ferramentas_historico
CREATE INDEX IF NOT EXISTS idx_ferramentas_hist_ferramenta ON public.ferramentas_historico (ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_hist_tipo ON public.ferramentas_historico (tipo);
CREATE INDEX IF NOT EXISTS idx_ferramentas_hist_created_at ON public.ferramentas_historico (created_at DESC);

-- requisicoes_compras
CREATE INDEX IF NOT EXISTS idx_req_compras_numero ON public.requisicoes_compras (numero);
CREATE INDEX IF NOT EXISTS idx_req_compras_created_at ON public.requisicoes_compras (created_at DESC);

-- cotacoes_compras
CREATE INDEX IF NOT EXISTS idx_cotacoes_status ON public.cotacoes_compras (status);
CREATE INDEX IF NOT EXISTS idx_cotacoes_requisicao ON public.cotacoes_compras (requisicao_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_numero ON public.cotacoes_compras (numero);

-- cotacao_convites
CREATE INDEX IF NOT EXISTS idx_convites_cotacao ON public.cotacao_convites (cotacao_id);
CREATE INDEX IF NOT EXISTS idx_convites_fornecedor ON public.cotacao_convites (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_convites_status ON public.cotacao_convites (status);

-- ordens_servico
CREATE INDEX IF NOT EXISTS idx_os_numero ON public.ordens_servico (numero);
CREATE INDEX IF NOT EXISTS idx_os_situacao ON public.ordens_servico (situacao);
CREATE INDEX IF NOT EXISTS idx_os_cliente ON public.ordens_servico (cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_solicitacao ON public.ordens_servico (solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_os_created_at ON public.ordens_servico (created_at DESC);

-- solicitacoes_servicos
CREATE INDEX IF NOT EXISTS idx_ss_numero ON public.solicitacoes_servicos (numero);
CREATE INDEX IF NOT EXISTS idx_ss_created_at ON public.solicitacoes_servicos (created_at DESC);

-- pedidos_compra
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos_compra (created_at DESC);

-- nfes_recebidas
CREATE INDEX IF NOT EXISTS idx_nfes_pedido ON public.nfes_recebidas (pedido_compra_id);
CREATE INDEX IF NOT EXISTS idx_nfes_status ON public.nfes_recebidas (status);
CREATE INDEX IF NOT EXISTS idx_nfes_empresa ON public.nfes_recebidas (empresa_id);

-- requisicoes
CREATE INDEX IF NOT EXISTS idx_requisicoes_created_at ON public.requisicoes (created_at DESC);

-- Atualiza estatísticas para o planner aproveitar os novos índices
ANALYZE public.materiais_servicos;
ANALYZE public.estoque_movimentacoes;
ANALYZE public.comunicacao_avisos_leitura;
ANALYZE public.recebimentos;
ANALYZE public.ferramentas_historico;
ANALYZE public.requisicoes_compras;
ANALYZE public.cotacoes_compras;
ANALYZE public.cotacao_convites;
ANALYZE public.ordens_servico;
ANALYZE public.solicitacoes_servicos;
ANALYZE public.pedidos_compra;
ANALYZE public.nfes_recebidas;
ANALYZE public.requisicoes;