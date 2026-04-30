-- Planos de Manutenção Preventiva (vinculados ao contrato do cliente)
CREATE TABLE public.planos_manutencao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT '',
  cliente_id TEXT NOT NULL DEFAULT '',
  cliente_nome TEXT NOT NULL DEFAULT '',
  contrato TEXT DEFAULT '',
  vigencia_inicio TEXT DEFAULT '',
  vigencia_fim TEXT DEFAULT '',
  responsavel_tecnico_id TEXT DEFAULT '',
  responsavel_tecnico_nome TEXT DEFAULT '',
  status TEXT DEFAULT 'Ativo',
  escopo TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  equipamentos_cobertos JSONB DEFAULT '[]'::jsonb,
  anexos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.planos_manutencao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all planos_manutencao" ON public.planos_manutencao FOR ALL USING (true) WITH CHECK (true);

-- Atividades de cada plano
CREATE TABLE public.plano_manutencao_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID NOT NULL REFERENCES public.planos_manutencao(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT '',
  equipamento_id TEXT DEFAULT '',
  equipamento_nome TEXT DEFAULT '',
  tipo TEXT DEFAULT 'Preventiva',
  periodicidade TEXT DEFAULT 'Mensal',
  prioridade TEXT DEFAULT 'Média',
  responsavel TEXT DEFAULT '',
  checklist JSONB DEFAULT '[]'::jsonb,
  anexos JSONB DEFAULT '[]'::jsonb,
  ultima_execucao TEXT DEFAULT '',
  proxima_execucao TEXT DEFAULT '',
  status TEXT DEFAULT 'Pendente',
  observacoes TEXT DEFAULT '',
  notificado_15d BOOLEAN DEFAULT false,
  notificado_5d BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.plano_manutencao_atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all plano_manut_ativ" ON public.plano_manutencao_atividades FOR ALL USING (true) WITH CHECK (true);

-- Histórico de execuções
CREATE TABLE public.plano_manutencao_execucoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID NOT NULL REFERENCES public.planos_manutencao(id) ON DELETE CASCADE,
  atividade_id UUID NOT NULL REFERENCES public.plano_manutencao_atividades(id) ON DELETE CASCADE,
  data_execucao TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  percentual_conformidade NUMERIC DEFAULT 0,
  checklist_resultado JSONB DEFAULT '[]'::jsonb,
  os_id TEXT DEFAULT '',
  os_numero INTEGER DEFAULT 0,
  evidencias JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.plano_manutencao_execucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all plano_manut_exec" ON public.plano_manutencao_execucoes FOR ALL USING (true) WITH CHECK (true);

-- Triggers updated_at
CREATE TRIGGER trg_planos_manut_updated BEFORE UPDATE ON public.planos_manutencao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_plano_ativ_updated BEFORE UPDATE ON public.plano_manutencao_atividades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_plano_ativ_plano ON public.plano_manutencao_atividades(plano_id);
CREATE INDEX idx_plano_exec_plano ON public.plano_manutencao_execucoes(plano_id);
CREATE INDEX idx_plano_exec_ativ ON public.plano_manutencao_execucoes(atividade_id);