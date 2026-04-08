
CREATE TABLE public.processos_trabalhistas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_processo text NOT NULL DEFAULT '',
  vara text DEFAULT '',
  comarca text DEFAULT '',
  estado text DEFAULT '',
  autor_nome text NOT NULL DEFAULT '',
  autor_cpf text DEFAULT '',
  advogado_autor text DEFAULT '',
  advogado_empresa text DEFAULT '',
  data_distribuicao date,
  objeto_acao text DEFAULT '',
  valor_causa numeric DEFAULT 0,
  provisao_contabil numeric DEFAULT 0,
  valor_acordo numeric DEFAULT 0,
  valor_condenacao numeric DEFAULT 0,
  honorarios numeric DEFAULT 0,
  risco text DEFAULT 'Médio',
  status text DEFAULT 'Ativo',
  fase_processual text DEFAULT 'Inicial',
  observacoes text DEFAULT '',
  anexos jsonb DEFAULT '[]'::jsonb,
  cliente_id text DEFAULT '',
  cliente_nome text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.processos_trabalhistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all processos_trabalhistas"
  ON public.processos_trabalhistas
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.processos_trabalhistas_andamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id uuid NOT NULL REFERENCES public.processos_trabalhistas(id) ON DELETE CASCADE,
  tipo text DEFAULT 'Outros',
  data_andamento date DEFAULT CURRENT_DATE,
  descricao text DEFAULT '',
  responsavel text DEFAULT '',
  prazo_limite date,
  status_prazo text DEFAULT 'Pendente',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.processos_trabalhistas_andamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all processos_trabalhistas_andamentos"
  ON public.processos_trabalhistas_andamentos
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
