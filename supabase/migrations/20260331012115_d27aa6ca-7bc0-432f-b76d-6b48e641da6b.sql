
CREATE TABLE public.solicitacoes_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial,
  cliente_id text,
  cliente_nome text,
  local_id text,
  local_descricao text,
  pavimento_id text,
  pavimento_descricao text,
  setor_id text,
  setor_descricao text,
  equipamento_id text,
  equipamento_nome text,
  descricao_servicos text,
  situacao text DEFAULT 'Aguardando aprovação',
  observacoes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.solicitacoes_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.solicitacoes_servicos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
