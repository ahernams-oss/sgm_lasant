
-- Cargos
CREATE TABLE public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  cbo TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  salario TEXT DEFAULT '',
  nivel TEXT DEFAULT '',
  data_base_salario TEXT DEFAULT '',
  salarios JSONB DEFAULT '[]'::jsonb,
  missao TEXT DEFAULT '',
  responsabilidades TEXT DEFAULT '',
  perfil_competencias TEXT DEFAULT '',
  anexos JSONB DEFAULT '[]'::jsonb,
  nrs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes (also used for Fornecedores)
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT DEFAULT 'Cliente',
  nome TEXT NOT NULL DEFAULT '',
  nome_fantasia TEXT DEFAULT '',
  cnpj TEXT DEFAULT '',
  inscricao_estadual TEXT DEFAULT '',
  inscricao_municipal TEXT DEFAULT '',
  esfera TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  email TEXT DEFAULT '',
  email_engenharia TEXT DEFAULT '',
  email_os_cc TEXT DEFAULT '',
  email_os_bcc TEXT DEFAULT '',
  email_ss_cc TEXT DEFAULT '',
  email_ss_bcc TEXT DEFAULT '',
  email_compras TEXT DEFAULT '',
  telefones JSONB DEFAULT '[]'::jsonb,
  telefone_celular TEXT DEFAULT '',
  celulares TEXT DEFAULT '',
  telefones_whatsapp TEXT DEFAULT '',
  cep TEXT DEFAULT '',
  bairro TEXT DEFAULT '',
  logradouro TEXT DEFAULT '',
  numero TEXT DEFAULT '',
  complemento TEXT DEFAULT '',
  uf TEXT DEFAULT '',
  cidade TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  data_inicio_contrato TEXT DEFAULT '',
  rel_linha1 TEXT DEFAULT '',
  rel_linha2 TEXT DEFAULT '',
  rel_linha3 TEXT DEFAULT '',
  rel_linha4 TEXT DEFAULT '',
  contato TEXT DEFAULT '',
  grupo_whatsapp TEXT DEFAULT '',
  informacoes_financeiras JSONB DEFAULT '[]'::jsonb,
  locais JSONB DEFAULT '[]'::jsonb,
  locais_entrega JSONB DEFAULT '[]'::jsonb,
  contratos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Usuarios
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  cargo_id TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  senha TEXT NOT NULL DEFAULT '',
  clientes_permitidos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fabricantes
CREATE TABLE public.fabricantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SCO
CREATE TABLE public.scos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cod_sco TEXT DEFAULT '',
  descricao_sco TEXT DEFAULT '',
  unidade TEXT DEFAULT '',
  tipo TEXT DEFAULT 'SCO',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- I0
CREATE TABLE public.i0_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes INTEGER NOT NULL DEFAULT 1,
  ano INTEGER NOT NULL DEFAULT 2024,
  cod_sco TEXT DEFAULT '',
  valor NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Materiais e Servicos
CREATE TABLE public.materiais_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  tipo TEXT DEFAULT 'Material',
  unidade_medida TEXT DEFAULT '',
  categoria_id TEXT DEFAULT '',
  fabricante_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categorias Compras (3 tables)
CREATE TABLE public.categorias_compras_grupos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT DEFAULT '',
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.categorias_compras_subgrupos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id TEXT NOT NULL DEFAULT '',
  codigo TEXT DEFAULT '',
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.categorias_compras_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_grupo_id TEXT NOT NULL DEFAULT '',
  codigo TEXT DEFAULT '',
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Requisicoes Compras
CREATE TABLE public.requisicoes_compras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT 0,
  data_criacao TEXT DEFAULT '',
  solicitante TEXT DEFAULT '',
  centro_custo TEXT DEFAULT '',
  centro_custo_nome TEXT DEFAULT '',
  local_entrega TEXT DEFAULT '',
  justificativa TEXT DEFAULT '',
  urgencia TEXT DEFAULT 'Normal',
  prazo_desejado TEXT DEFAULT '',
  status TEXT DEFAULT 'Enviada',
  itens JSONB DEFAULT '[]'::jsonb,
  anexos JSONB DEFAULT '[]'::jsonb,
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cotacoes Compras
CREATE TABLE public.cotacoes_compras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisicao_id TEXT DEFAULT '',
  requisicao_numero INTEGER DEFAULT 0,
  numero INTEGER NOT NULL DEFAULT 0,
  data_criacao TEXT DEFAULT '',
  comprador TEXT DEFAULT '',
  status TEXT DEFAULT 'Em Andamento',
  propostas JSONB DEFAULT '[]'::jsonb,
  fornecedor_vencedor_id TEXT DEFAULT '',
  justificativa_escolha TEXT DEFAULT '',
  itens_vencedores JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pedidos Compra
CREATE TABLE public.pedidos_compra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT 0,
  cotacao_id TEXT DEFAULT '',
  requisicao_id TEXT DEFAULT '',
  requisicao_numero INTEGER DEFAULT 0,
  data_criacao TEXT DEFAULT '',
  comprador TEXT DEFAULT '',
  fornecedor_id TEXT DEFAULT '',
  fornecedor_nome TEXT DEFAULT '',
  itens JSONB DEFAULT '[]'::jsonb,
  condicao_pagamento TEXT DEFAULT '',
  prazo_entrega TEXT DEFAULT '',
  local_entrega TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  valor_total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Emitido',
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recebimentos
CREATE TABLE public.recebimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id TEXT DEFAULT '',
  pedido_numero INTEGER DEFAULT 0,
  requisicao_id TEXT DEFAULT '',
  requisicao_numero INTEGER DEFAULT 0,
  fornecedor_nome TEXT DEFAULT '',
  local_entrega TEXT DEFAULT '',
  data_recebimento TEXT DEFAULT '',
  usuario TEXT DEFAULT '',
  itens JSONB DEFAULT '[]'::jsonb,
  observacao_geral TEXT DEFAULT '',
  tipo TEXT DEFAULT 'Total',
  nota_fiscal TEXT DEFAULT '',
  anexos_nf JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Requisicoes (colaboradores)
CREATE TABLE public.requisicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT 0,
  data_criacao TEXT DEFAULT '',
  unidade TEXT DEFAULT '',
  cargo_nome TEXT DEFAULT '',
  cargo_id TEXT DEFAULT '',
  jornada TEXT DEFAULT '',
  carga_horaria TEXT DEFAULT '',
  tipo_contratacao JSONB DEFAULT '[]'::jsonb,
  interno_externo TEXT DEFAULT '',
  origem_vaga TEXT DEFAULT '',
  motivo_outros TEXT DEFAULT '',
  matricula TEXT DEFAULT '',
  nome_substituido TEXT DEFAULT '',
  cargo_substituido TEXT DEFAULT '',
  salario_substituido TEXT DEFAULT '',
  data_desligamento TEXT DEFAULT '',
  formacao JSONB DEFAULT '[]'::jsonb,
  formacao_detalhe TEXT DEFAULT '',
  experiencia TEXT DEFAULT '',
  conhecimento_informatica TEXT DEFAULT '',
  atividades_cargo TEXT DEFAULT '',
  salario_vaga TEXT DEFAULT '',
  status TEXT DEFAULT 'Pendente',
  aprovado_por TEXT DEFAULT '',
  historico_status JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Processos Seletivos
CREATE TABLE public.processos_seletivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requisicao_id TEXT NOT NULL DEFAULT '',
  data_criacao TEXT DEFAULT '',
  candidatos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lancamentos (faltas/horas extras)
CREATE TABLE public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id TEXT NOT NULL DEFAULT '',
  tipo TEXT DEFAULT 'falta',
  data TEXT DEFAULT '',
  tipo_falta TEXT DEFAULT '',
  dias_falta NUMERIC DEFAULT 0,
  anexos JSONB DEFAULT '[]'::jsonb,
  horas_extras NUMERIC DEFAULT 0,
  percentual NUMERIC DEFAULT 0,
  observacao TEXT DEFAULT '',
  criado_em TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for all tables (public access)
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all cargos" ON public.cargos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.fabricantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all fabricantes" ON public.fabricantes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.scos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all scos" ON public.scos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.i0_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all i0_items" ON public.i0_items FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.materiais_servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all materiais_servicos" ON public.materiais_servicos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.categorias_compras_grupos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all cat_grupos" ON public.categorias_compras_grupos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.categorias_compras_subgrupos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all cat_subgrupos" ON public.categorias_compras_subgrupos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.categorias_compras_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all cat_classes" ON public.categorias_compras_classes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.requisicoes_compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all req_compras" ON public.requisicoes_compras FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.cotacoes_compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all cot_compras" ON public.cotacoes_compras FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ped_compra" ON public.pedidos_compra FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all recebimentos" ON public.recebimentos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.requisicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all requisicoes" ON public.requisicoes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.processos_seletivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all proc_seletivos" ON public.processos_seletivos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all lancamentos" ON public.lancamentos FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin user
INSERT INTO public.usuarios (id, nome, email, senha) VALUES ('00000000-0000-0000-0000-000000000001', 'Superadmin', 'ahernams@gmail.com', '102030');
