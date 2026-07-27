
-- =====================================================================
-- PORTAL DO FUNCIONÁRIO E CANDIDATO
-- =====================================================================

-- 1) CREDENCIAIS
CREATE TABLE public.portal_credenciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL UNIQUE,
  senha_hash TEXT,
  tipo_acesso TEXT NOT NULL CHECK (tipo_acesso IN ('funcionario','candidato')),
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  processo_seletivo_id UUID REFERENCES public.processos_seletivos(id) ON DELETE CASCADE,
  candidato_ref TEXT,
  email TEXT,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  bloqueado_ate TIMESTAMPTZ,
  tentativas_falhas INT NOT NULL DEFAULT 0,
  reset_token TEXT,
  reset_token_expira TIMESTAMPTZ,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portal_cred_func_idx ON public.portal_credenciais(funcionario_id);
CREATE INDEX portal_cred_ps_idx ON public.portal_credenciais(processo_seletivo_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_credenciais TO authenticated;
GRANT ALL ON public.portal_credenciais TO service_role;
ALTER TABLE public.portal_credenciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_cred_admin_all" ON public.portal_credenciais FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_portal_cred_upd BEFORE UPDATE ON public.portal_credenciais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) HOLERITES
CREATE TABLE public.portal_holerites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('folha','13o','ferias','rescisao','outros')),
  competencia_mes INT NOT NULL CHECK (competencia_mes BETWEEN 1 AND 12),
  competencia_ano INT NOT NULL,
  descricao TEXT,
  arquivo_path TEXT NOT NULL,
  disponibilizado_por UUID,
  disponibilizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  visualizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portal_holerite_func_idx ON public.portal_holerites(funcionario_id, competencia_ano DESC, competencia_mes DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_holerites TO authenticated;
GRANT ALL ON public.portal_holerites TO service_role;
ALTER TABLE public.portal_holerites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_holerite_admin_all" ON public.portal_holerites FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_portal_holerite_upd BEFORE UPDATE ON public.portal_holerites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) FICHA DE ADMISSÃO (candidato)
CREATE TABLE public.portal_ficha_admissao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_seletivo_id UUID REFERENCES public.processos_seletivos(id) ON DELETE CASCADE,
  candidato_ref TEXT NOT NULL,
  cpf TEXT NOT NULL,
  dados_pessoais JSONB NOT NULL DEFAULT '{}'::jsonb,
  endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  bancarios JSONB NOT NULL DEFAULT '{}'::jsonb,
  dependentes JSONB NOT NULL DEFAULT '[]'::jsonb,
  contatos_emergencia JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviada','em_analise','aprovada','reprovada')),
  observacoes_rh TEXT,
  revisor_id UUID,
  revisado_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX portal_ficha_cpf_idx ON public.portal_ficha_admissao(cpf);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_ficha_admissao TO authenticated;
GRANT ALL ON public.portal_ficha_admissao TO service_role;
ALTER TABLE public.portal_ficha_admissao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_ficha_admin_all" ON public.portal_ficha_admissao FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_portal_ficha_upd BEFORE UPDATE ON public.portal_ficha_admissao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) DOCUMENTOS DO CANDIDATO
CREATE TABLE public.portal_documentos_candidato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL,
  processo_seletivo_id UUID REFERENCES public.processos_seletivos(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','reprovado')),
  observacao TEXT,
  revisor_id UUID,
  revisado_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portal_docs_cand_cpf_idx ON public.portal_documentos_candidato(cpf);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_documentos_candidato TO authenticated;
GRANT ALL ON public.portal_documentos_candidato TO service_role;
ALTER TABLE public.portal_documentos_candidato ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_docs_cand_admin_all" ON public.portal_documentos_candidato FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_portal_docs_cand_upd BEFORE UPDATE ON public.portal_documentos_candidato
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) TERMOS ASSINADOS
CREATE TABLE public.portal_termos_assinados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL,
  tipo_acesso TEXT NOT NULL CHECK (tipo_acesso IN ('funcionario','candidato')),
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  processo_seletivo_id UUID REFERENCES public.processos_seletivos(id) ON DELETE SET NULL,
  tipo_termo TEXT NOT NULL,
  versao_termo TEXT,
  texto_aceite TEXT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  assinado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portal_termos_cpf_idx ON public.portal_termos_assinados(cpf);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_termos_assinados TO authenticated;
GRANT ALL ON public.portal_termos_assinados TO service_role;
ALTER TABLE public.portal_termos_assinados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_termos_admin_all" ON public.portal_termos_assinados FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6) TREINAMENTOS DE INTEGRAÇÃO
CREATE TABLE public.portal_treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL,
  processo_seletivo_id UUID REFERENCES public.processos_seletivos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  concluido_em TIMESTAMPTZ,
  nota NUMERIC(5,2),
  certificado_path TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','concluido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portal_trein_cpf_idx ON public.portal_treinamentos(cpf);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_treinamentos TO authenticated;
GRANT ALL ON public.portal_treinamentos TO service_role;
ALTER TABLE public.portal_treinamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_trein_admin_all" ON public.portal_treinamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_portal_trein_upd BEFORE UPDATE ON public.portal_treinamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) LOG DE ACESSOS
CREATE TABLE public.portal_acessos_log (
  id BIGSERIAL PRIMARY KEY,
  cpf TEXT,
  credencial_id UUID REFERENCES public.portal_credenciais(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  sucesso BOOLEAN NOT NULL,
  detalhes JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX portal_log_cpf_idx ON public.portal_acessos_log(cpf, created_at DESC);

GRANT SELECT, INSERT ON public.portal_acessos_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.portal_acessos_log_id_seq TO authenticated;
GRANT ALL ON public.portal_acessos_log TO service_role;
GRANT ALL ON SEQUENCE public.portal_acessos_log_id_seq TO service_role;
ALTER TABLE public.portal_acessos_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_log_admin_all" ON public.portal_acessos_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
