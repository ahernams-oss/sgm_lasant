
-- Cadastro de ferramentas
CREATE TABLE public.ferramentas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  marca TEXT DEFAULT '',
  modelo TEXT DEFAULT '',
  numero_serie TEXT DEFAULT '',
  estado_conservacao TEXT DEFAULT 'Novo',
  valor_aquisicao NUMERIC DEFAULT 0,
  data_aquisicao TEXT DEFAULT '',
  nota_fiscal TEXT DEFAULT '',
  patrimonio TEXT DEFAULT '',
  foto_url TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  data_calibracao TEXT DEFAULT '',
  validade_calibracao TEXT DEFAULT '',
  certificado_calibracao_url TEXT DEFAULT '',
  centro_custo_atual_id TEXT DEFAULT '',
  centro_custo_atual_nome TEXT DEFAULT '',
  status TEXT DEFAULT 'Disponível',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ferramentas" ON public.ferramentas FOR ALL TO public USING (true) WITH CHECK (true);

-- Vínculos ferramenta <-> funcionário
CREATE TABLE public.ferramentas_vinculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id TEXT NOT NULL DEFAULT '',
  ferramenta_descricao TEXT DEFAULT '',
  funcionario_id TEXT NOT NULL DEFAULT '',
  funcionario_nome TEXT DEFAULT '',
  data_vinculo TEXT DEFAULT '',
  data_devolucao TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  status TEXT DEFAULT 'Ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ferramentas_vinculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ferramentas_vinculos" ON public.ferramentas_vinculos FOR ALL TO public USING (true) WITH CHECK (true);

-- Empréstimos entre centros de custo
CREATE TABLE public.ferramentas_emprestimos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id TEXT NOT NULL DEFAULT '',
  ferramenta_descricao TEXT DEFAULT '',
  centro_custo_origem_id TEXT DEFAULT '',
  centro_custo_origem_nome TEXT DEFAULT '',
  centro_custo_destino_id TEXT DEFAULT '',
  centro_custo_destino_nome TEXT DEFAULT '',
  solicitante TEXT DEFAULT '',
  data_solicitacao TEXT DEFAULT '',
  data_aprovacao TEXT DEFAULT '',
  aprovado_por TEXT DEFAULT '',
  data_devolucao_prevista TEXT DEFAULT '',
  data_devolucao_real TEXT DEFAULT '',
  status TEXT DEFAULT 'Pendente',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ferramentas_emprestimos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ferramentas_emprestimos" ON public.ferramentas_emprestimos FOR ALL TO public USING (true) WITH CHECK (true);

-- Histórico de transações
CREATE TABLE public.ferramentas_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ferramenta_id TEXT NOT NULL DEFAULT '',
  ferramenta_descricao TEXT DEFAULT '',
  tipo TEXT DEFAULT '',
  descricao TEXT DEFAULT '',
  usuario TEXT DEFAULT '',
  data_evento TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ferramentas_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all ferramentas_historico" ON public.ferramentas_historico FOR ALL TO public USING (true) WITH CHECK (true);
