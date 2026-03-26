
-- Tabela principal de licitações (oportunidades)
CREATE TABLE public.licitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  numero_processo text DEFAULT '',
  numero_edital text DEFAULT '',
  modalidade text DEFAULT '',
  orgao_licitante text DEFAULT '',
  uasg text DEFAULT '',
  objeto_resumido text DEFAULT '',
  objeto_detalhado text DEFAULT '',
  cidade text DEFAULT '',
  estado text DEFAULT '',
  data_publicacao date,
  data_sessao timestamptz,
  prazo_impugnacao date,
  prazo_esclarecimento date,
  portal_disputa text DEFAULT '',
  link_edital text DEFAULT '',
  valor_estimado numeric DEFAULT 0,
  criterio_julgamento text DEFAULT '',
  regime_execucao text DEFAULT '',
  prazo_contratual text DEFAULT '',
  possibilidade_prorrogacao boolean DEFAULT false,
  exigencia_visita_tecnica boolean DEFAULT false,
  exigencia_garantia boolean DEFAULT false,
  status text DEFAULT 'Novo',
  responsavel_interno text DEFAULT '',
  grau_interesse text DEFAULT 'Médio',
  probabilidade_exito text DEFAULT 'Média',
  observacoes text DEFAULT ''
);

ALTER TABLE public.licitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all licitacoes" ON public.licitacoes FOR ALL TO public USING (true) WITH CHECK (true);

-- Tabela de documentos vinculados a licitações
CREATE TABLE public.licitacoes_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  nome text NOT NULL DEFAULT '',
  tipo_documental text DEFAULT '',
  categoria text DEFAULT '',
  orgao_emissor text DEFAULT '',
  data_emissao date,
  data_validade date,
  status text DEFAULT 'Válido',
  arquivo_url text DEFAULT '',
  arquivo_nome text DEFAULT '',
  observacoes text DEFAULT '',
  versao integer DEFAULT 1,
  licitacoes_vinculadas jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.licitacoes_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all licitacoes_documentos" ON public.licitacoes_documentos FOR ALL TO public USING (true) WITH CHECK (true);

-- Tabela de análise de edital
CREATE TABLE public.licitacoes_analises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  licitacao_id uuid REFERENCES public.licitacoes(id) ON DELETE CASCADE NOT NULL,
  resumo_objeto text DEFAULT '',
  exigencias_tecnicas text DEFAULT '',
  exigencias_economicas text DEFAULT '',
  documentos_obrigatorios text DEFAULT '',
  exigencias_equipe text DEFAULT '',
  exigencia_vistoria text DEFAULT '',
  exigencia_garantia_proposta text DEFAULT '',
  necessidade_cat_crea_cau text DEFAULT '',
  necessidade_certidoes text DEFAULT '',
  riscos_juridicos text DEFAULT '',
  pontos_restritivos text DEFAULT '',
  oportunidades_impugnacao text DEFAULT '',
  decisao_participar text DEFAULT 'Pendente de decisão da diretoria',
  analista text DEFAULT '',
  data_analise date DEFAULT CURRENT_DATE,
  observacoes text DEFAULT ''
);

ALTER TABLE public.licitacoes_analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all licitacoes_analises" ON public.licitacoes_analises FOR ALL TO public USING (true) WITH CHECK (true);

-- Storage bucket para documentos de licitações
INSERT INTO storage.buckets (id, name, public) VALUES ('licitacoes-documentos', 'licitacoes-documentos', true);

-- RLS policy para o bucket
CREATE POLICY "Allow public access to licitacoes docs" ON storage.objects FOR ALL TO public USING (bucket_id = 'licitacoes-documentos') WITH CHECK (bucket_id = 'licitacoes-documentos');
