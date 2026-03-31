
-- =============================================
-- MÓDULO PMOC - Tabelas principais
-- =============================================

-- 1. Planos PMOC
CREATE TABLE public.pmoc_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  titulo text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  cliente_id text DEFAULT '',
  cliente_nome text DEFAULT '',
  unidade text DEFAULT '',
  contrato text DEFAULT '',
  edificio text DEFAULT '',
  ambiente_critico text DEFAULT '',
  vigencia_inicio date,
  vigencia_fim date,
  revisao integer DEFAULT 1,
  status text DEFAULT 'Ativo',
  responsavel_tecnico_id text DEFAULT '',
  responsavel_tecnico_nome text DEFAULT '',
  observacoes text DEFAULT '',
  documentos_anexos jsonb DEFAULT '[]'::jsonb,
  historico_revisoes jsonb DEFAULT '[]'::jsonb,
  procedimentos_falha text DEFAULT '',
  contingencia text DEFAULT ''
);
ALTER TABLE public.pmoc_planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_planos" ON public.pmoc_planos FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. Atividades programadas do PMOC
CREATE TABLE public.pmoc_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  plano_id text NOT NULL DEFAULT '',
  equipamento_id text DEFAULT '',
  equipamento_nome text DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  tipo text DEFAULT 'Preventiva',
  periodicidade text DEFAULT 'Mensal',
  checklist_id text DEFAULT '',
  checklist_titulo text DEFAULT '',
  parametros_tecnicos text DEFAULT '',
  procedimento_falha text DEFAULT '',
  prioridade text DEFAULT 'Normal',
  duracao_estimada text DEFAULT '',
  materiais_previstos jsonb DEFAULT '[]'::jsonb,
  ativa boolean DEFAULT true,
  ultima_execucao date,
  proxima_execucao date
);
ALTER TABLE public.pmoc_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_atividades" ON public.pmoc_atividades FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Ordens de serviço PMOC
CREATE TABLE public.pmoc_ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  numero serial,
  plano_id text DEFAULT '',
  atividade_id text DEFAULT '',
  equipamento_id text DEFAULT '',
  equipamento_nome text DEFAULT '',
  origem text DEFAULT 'PMOC',
  unidade text DEFAULT '',
  local_descricao text DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  tipo text DEFAULT 'Preventiva',
  prioridade text DEFAULT 'Normal',
  status text DEFAULT 'Aberta',
  data_abertura date DEFAULT CURRENT_DATE,
  data_prazo date,
  data_inicio_execucao timestamptz,
  data_conclusao timestamptz,
  tecnico_responsavel text DEFAULT '',
  equipe text DEFAULT '',
  materiais_previstos jsonb DEFAULT '[]'::jsonb,
  materiais_utilizados jsonb DEFAULT '[]'::jsonb,
  checklist_id text DEFAULT '',
  checklist_resultado jsonb DEFAULT '[]'::jsonb,
  evidencias jsonb DEFAULT '[]'::jsonb,
  evidencias_obrigatorias boolean DEFAULT false,
  observacoes text DEFAULT '',
  aprovado_por text DEFAULT '',
  data_aprovacao timestamptz
);
ALTER TABLE public.pmoc_ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_os" ON public.pmoc_ordens_servico FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Responsáveis técnicos
CREATE TABLE public.pmoc_responsaveis_tecnicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  nome text NOT NULL DEFAULT '',
  registro_profissional text DEFAULT '',
  tipo_registro text DEFAULT 'CREA',
  especialidade text DEFAULT '',
  telefone text DEFAULT '',
  email text DEFAULT '',
  documento_art_rrt text DEFAULT '',
  documento_url text DEFAULT '',
  vigencia_inicio date,
  vigencia_fim date,
  status text DEFAULT 'Ativo',
  clientes_vinculados jsonb DEFAULT '[]'::jsonb,
  observacoes text DEFAULT ''
);
ALTER TABLE public.pmoc_responsaveis_tecnicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_rt" ON public.pmoc_responsaveis_tecnicos FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Pontos de medição de qualidade do ar
CREATE TABLE public.pmoc_qualidade_ar_pontos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  plano_id text DEFAULT '',
  cliente_id text DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  ambiente text DEFAULT '',
  edificio text DEFAULT '',
  pavimento text DEFAULT '',
  tipo_ambiente text DEFAULT '',
  parametros_monitorados jsonb DEFAULT '[]'::jsonb,
  periodicidade_coleta text DEFAULT 'Mensal',
  status text DEFAULT 'Ativo'
);
ALTER TABLE public.pmoc_qualidade_ar_pontos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_qa_pontos" ON public.pmoc_qualidade_ar_pontos FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. Medições de qualidade do ar
CREATE TABLE public.pmoc_qualidade_ar_medicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  ponto_id text NOT NULL DEFAULT '',
  ponto_descricao text DEFAULT '',
  data_medicao date DEFAULT CURRENT_DATE,
  hora_medicao text DEFAULT '',
  temperatura numeric,
  umidade numeric,
  co2 numeric,
  renovacao_ar numeric,
  pressao_diferencial numeric,
  outros_parametros jsonb DEFAULT '{}'::jsonb,
  conforme boolean DEFAULT true,
  observacoes text DEFAULT '',
  relatorio_laboratorial_url text DEFAULT '',
  responsavel text DEFAULT '',
  plano_acao text DEFAULT ''
);
ALTER TABLE public.pmoc_qualidade_ar_medicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_qa_med" ON public.pmoc_qualidade_ar_medicoes FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. Inconformidades
CREATE TABLE public.pmoc_inconformidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  numero serial,
  plano_id text DEFAULT '',
  os_id text DEFAULT '',
  equipamento_id text DEFAULT '',
  equipamento_nome text DEFAULT '',
  ambiente text DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  gravidade text DEFAULT 'Moderada',
  causa_provavel text DEFAULT '',
  plano_acao text DEFAULT '',
  prazo date,
  responsavel text DEFAULT '',
  status text DEFAULT 'Aberta',
  data_encerramento date,
  reavaliacao text DEFAULT '',
  reincidencia integer DEFAULT 0,
  evidencias jsonb DEFAULT '[]'::jsonb,
  historico jsonb DEFAULT '[]'::jsonb
);
ALTER TABLE public.pmoc_inconformidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_inconformidades" ON public.pmoc_inconformidades FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. Biblioteca de rotinas/modelos
CREATE TABLE public.pmoc_biblioteca_rotinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  titulo text NOT NULL DEFAULT '',
  tipo_equipamento text DEFAULT '',
  tipo_atividade text DEFAULT 'Preventiva',
  descricao text DEFAULT '',
  checklist_itens jsonb DEFAULT '[]'::jsonb,
  periodicidade_sugerida text DEFAULT 'Mensal',
  materiais_sugeridos jsonb DEFAULT '[]'::jsonb,
  duracao_estimada text DEFAULT '',
  versao integer DEFAULT 1,
  ativa boolean DEFAULT true
);
ALTER TABLE public.pmoc_biblioteca_rotinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all pmoc_biblioteca" ON public.pmoc_biblioteca_rotinas FOR ALL TO public USING (true) WITH CHECK (true);
