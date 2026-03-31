
CREATE TABLE public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL DEFAULT 0,
  solicitacao_id text DEFAULT '',
  solicitacao_numero integer DEFAULT 0,
  n_cliente text DEFAULT '',
  cliente_id text DEFAULT '',
  cliente_nome text DEFAULT '',
  situacao text DEFAULT 'Aberta',
  data_inicio text DEFAULT '',
  hora_inicio text DEFAULT '',
  data_termino text DEFAULT '',
  hora_termino text DEFAULT '',
  prioridade text DEFAULT 'C: PROGRAMADA',
  solicitante text DEFAULT '',
  matricula text DEFAULT '',
  ramal text DEFAULT '',
  telefone text DEFAULT '',
  local_id text DEFAULT '',
  local_descricao text DEFAULT '',
  pavimento_id text DEFAULT '',
  pavimento_descricao text DEFAULT '',
  setor_id text DEFAULT '',
  setor_descricao text DEFAULT '',
  categoria text DEFAULT '',
  servico text DEFAULT '',
  descricao_servicos text DEFAULT '',
  ressalva_aprovacao text DEFAULT '',
  descricao_conclusao text DEFAULT '',
  materiais jsonb DEFAULT '[]'::jsonb,
  materiais_estoque jsonb DEFAULT '[]'::jsonb,
  anexos jsonb DEFAULT '[]'::jsonb,
  fotos jsonb DEFAULT '[]'::jsonb,
  observacoes_fiscalizacao jsonb DEFAULT '[]'::jsonb,
  bdi numeric DEFAULT 0,
  operador_id text DEFAULT '',
  operador_nome text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all ordens_servico" ON public.ordens_servico
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);
