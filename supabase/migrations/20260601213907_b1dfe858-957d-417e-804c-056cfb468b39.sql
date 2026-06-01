
-- ============ TABELA PRINCIPAL ============
CREATE TABLE public.pregoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INT NOT NULL DEFAULT 0,
  objeto TEXT NOT NULL DEFAULT '',
  modalidade TEXT NOT NULL DEFAULT 'Aberto', -- Aberto | Aberto-Fechado | Fechado
  tipo_disputa TEXT NOT NULL DEFAULT 'Item', -- Item | Lote | Misto
  valor_estimado NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_estimado_sigiloso BOOLEAN NOT NULL DEFAULT true,
  decremento_minimo NUMERIC(15,2) NOT NULL DEFAULT 0,
  decremento_tipo TEXT NOT NULL DEFAULT 'reais', -- reais | percentual
  tempo_disputa_min INT NOT NULL DEFAULT 10,
  tempo_prorrogacao_min INT NOT NULL DEFAULT 2,
  data_publicacao TIMESTAMPTZ,
  data_abertura_credenciamento TIMESTAMPTZ,
  data_abertura_propostas TIMESTAMPTZ,
  data_inicio_disputa TIMESTAMPTZ,
  data_encerramento_disputa TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Rascunho', -- Rascunho | Publicado | Credenciamento | Propostas | Disputa | Habilitacao | Adjudicado | Homologado | Cancelado | Encerrado
  termo_participacao TEXT NOT NULL DEFAULT '',
  termo_hash TEXT,
  pregoeiro_id UUID,
  pregoeiro_nome TEXT,
  observacoes TEXT NOT NULL DEFAULT '',
  motivo_cancelamento TEXT,
  resultado_publico BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregoes TO anon, authenticated;
GRANT ALL ON public.pregoes TO service_role;
ALTER TABLE public.pregoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregoes_all" ON public.pregoes FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_next_pregao_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_year INT;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::INT;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.pregoes
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::INT = v_year;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_pregao_numero BEFORE INSERT ON public.pregoes
FOR EACH ROW EXECUTE FUNCTION public.set_next_pregao_numero();

CREATE TRIGGER trg_update_pregoes_updated_at BEFORE UPDATE ON public.pregoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ITENS / LOTES ============
CREATE TABLE public.pregao_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 1,
  agrupamento TEXT NOT NULL DEFAULT 'Item', -- Item | Lote
  lote_codigo TEXT, -- ex "L1" agrupa vários
  material_id UUID,
  descricao TEXT NOT NULL DEFAULT '',
  unidade TEXT NOT NULL DEFAULT 'UN',
  quantidade NUMERIC(15,4) NOT NULL DEFAULT 1,
  preco_referencia NUMERIC(15,2) NOT NULL DEFAULT 0,
  preco_referencia_sigiloso BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'Aguardando', -- Aguardando | EmDisputa | Suspenso | Encerrado | Fracassado | Deserto
  iniciado_em TIMESTAMPTZ,
  encerra_em TIMESTAMPTZ,
  encerrado_em TIMESTAMPTZ,
  vencedor_participante_id UUID,
  vencedor_valor NUMERIC(15,2),
  vencedor_valor_unitario NUMERIC(15,2),
  observacoes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_itens TO anon, authenticated;
GRANT ALL ON public.pregao_itens TO service_role;
ALTER TABLE public.pregao_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_itens_all" ON public.pregao_itens FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_itens_pregao ON public.pregao_itens(pregao_id);
CREATE TRIGGER trg_update_pregao_itens_updated_at BEFORE UPDATE ON public.pregao_itens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DOCUMENTOS EXIGIDOS (habilitacao) ============
CREATE TABLE public.pregao_documentos_exigidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  ordem INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_documentos_exigidos TO anon, authenticated;
GRANT ALL ON public.pregao_documentos_exigidos TO service_role;
ALTER TABLE public.pregao_documentos_exigidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_docs_exig_all" ON public.pregao_documentos_exigidos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_docs_exig_pregao ON public.pregao_documentos_exigidos(pregao_id);

-- ============ PARTICIPANTES (credenciamento) ============
CREATE TABLE public.pregao_participantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL,
  fornecedor_nome TEXT NOT NULL DEFAULT '',
  fornecedor_cnpj TEXT NOT NULL DEFAULT '',
  apelido TEXT NOT NULL DEFAULT '', -- "Licitante 01"
  apelido_seq INT NOT NULL DEFAULT 0,
  termo_aceito_em TIMESTAMPTZ,
  termo_aceito_ip TEXT,
  termo_hash TEXT,
  status TEXT NOT NULL DEFAULT 'Credenciado', -- Credenciado | Desclassificado | Inabilitado | Habilitado | Vencedor | Desistente
  motivo_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pregao_id, fornecedor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_participantes TO anon, authenticated;
GRANT ALL ON public.pregao_participantes TO service_role;
ALTER TABLE public.pregao_participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_part_all" ON public.pregao_participantes FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_part_pregao ON public.pregao_participantes(pregao_id);
CREATE INDEX idx_pregao_part_forn ON public.pregao_participantes(fornecedor_id);
CREATE TRIGGER trg_update_pregao_part_updated_at BEFORE UPDATE ON public.pregao_participantes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROPOSTAS INICIAIS ============
CREATE TABLE public.pregao_propostas_iniciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.pregao_itens(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.pregao_participantes(id) ON DELETE CASCADE,
  valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  marca TEXT,
  modelo TEXT,
  observacoes TEXT NOT NULL DEFAULT '',
  enviada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, participante_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_propostas_iniciais TO anon, authenticated;
GRANT ALL ON public.pregao_propostas_iniciais TO service_role;
ALTER TABLE public.pregao_propostas_iniciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_prop_ini_all" ON public.pregao_propostas_iniciais FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_prop_ini_item ON public.pregao_propostas_iniciais(item_id);

-- ============ LANCES ============
CREATE TABLE public.pregao_lances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.pregao_itens(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.pregao_participantes(id) ON DELETE CASCADE,
  valor NUMERIC(15,2) NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelado BOOLEAN NOT NULL DEFAULT false,
  motivo_cancelamento TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_lances TO anon, authenticated;
GRANT ALL ON public.pregao_lances TO service_role;
ALTER TABLE public.pregao_lances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_lances_all" ON public.pregao_lances FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_lances_item ON public.pregao_lances(item_id, ts DESC);
CREATE INDEX idx_pregao_lances_pregao ON public.pregao_lances(pregao_id);

-- ============ PROPOSTAS FECHADAS (Aberto-Fechado / Fechado) ============
CREATE TABLE public.pregao_propostas_fechadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.pregao_itens(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.pregao_participantes(id) ON DELETE CASCADE,
  valor NUMERIC(15,2) NOT NULL,
  enviada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revelada BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(item_id, participante_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_propostas_fechadas TO anon, authenticated;
GRANT ALL ON public.pregao_propostas_fechadas TO service_role;
ALTER TABLE public.pregao_propostas_fechadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_prop_fech_all" ON public.pregao_propostas_fechadas FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_prop_fech_item ON public.pregao_propostas_fechadas(item_id);

-- ============ HABILITAÇÃO (análise documental) ============
CREATE TABLE public.pregao_habilitacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.pregao_participantes(id) ON DELETE CASCADE,
  documento_exigido_id UUID REFERENCES public.pregao_documentos_exigidos(id) ON DELETE SET NULL,
  documento_nome TEXT NOT NULL DEFAULT '',
  arquivo_url TEXT,
  arquivo_nome TEXT,
  status TEXT NOT NULL DEFAULT 'Pendente', -- Pendente | Aprovado | Reprovado
  observacao TEXT NOT NULL DEFAULT '',
  analisado_em TIMESTAMPTZ,
  analisado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_habilitacao TO anon, authenticated;
GRANT ALL ON public.pregao_habilitacao TO service_role;
ALTER TABLE public.pregao_habilitacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_hab_all" ON public.pregao_habilitacao FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_hab_part ON public.pregao_habilitacao(participante_id);
CREATE TRIGGER trg_update_pregao_hab_updated_at BEFORE UPDATE ON public.pregao_habilitacao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CHAT / MENSAGENS ============
CREATE TABLE public.pregao_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.pregao_itens(id) ON DELETE CASCADE,
  autor_tipo TEXT NOT NULL DEFAULT 'pregoeiro', -- pregoeiro | participante | sistema
  autor_id UUID,
  autor_nome_exibicao TEXT NOT NULL DEFAULT '', -- "Pregoeiro" ou "Licitante 03"
  mensagem TEXT NOT NULL DEFAULT '',
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_mensagens TO anon, authenticated;
GRANT ALL ON public.pregao_mensagens TO service_role;
ALTER TABLE public.pregao_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_msg_all" ON public.pregao_mensagens FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_msg_pregao ON public.pregao_mensagens(pregao_id, ts);

-- ============ EVENTOS / AUDITORIA ============
CREATE TABLE public.pregao_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pregao_id UUID NOT NULL REFERENCES public.pregoes(id) ON DELETE CASCADE,
  item_id UUID,
  evento TEXT NOT NULL DEFAULT '', -- abriu_disputa | suspendeu | reabriu | prorrogou | encerrou | lance | habilitou | inabilitou | adjudicou | homologou | cancelou
  ator_tipo TEXT NOT NULL DEFAULT 'pregoeiro',
  ator_id UUID,
  ator_nome TEXT NOT NULL DEFAULT '',
  ip TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pregao_eventos TO anon, authenticated;
GRANT ALL ON public.pregao_eventos TO service_role;
ALTER TABLE public.pregao_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pregao_eventos_all" ON public.pregao_eventos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_pregao_eventos_pregao ON public.pregao_eventos(pregao_id, ts DESC);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('pregao-documentos', 'pregao-documentos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "pregao_docs_read" ON storage.objects FOR SELECT USING (bucket_id = 'pregao-documentos');
CREATE POLICY "pregao_docs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pregao-documentos');
CREATE POLICY "pregao_docs_update" ON storage.objects FOR UPDATE USING (bucket_id = 'pregao-documentos');
CREATE POLICY "pregao_docs_delete" ON storage.objects FOR DELETE USING (bucket_id = 'pregao-documentos');

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.pregao_lances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pregao_itens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pregao_mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pregao_participantes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pregoes;
