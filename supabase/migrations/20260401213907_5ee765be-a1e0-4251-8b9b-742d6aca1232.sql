
CREATE TABLE public.orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT 0,
  solicitacao_id TEXT NOT NULL DEFAULT '',
  solicitacao_numero INTEGER NOT NULL DEFAULT 0,
  cliente_id TEXT NOT NULL DEFAULT '',
  cliente_nome TEXT NOT NULL DEFAULT '',
  itens_sco JSONB NOT NULL DEFAULT '[]'::jsonb,
  itens_materiais JSONB NOT NULL DEFAULT '[]'::jsonb,
  anexos JSONB NOT NULL DEFAULT '[]'::jsonb,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente',
  observacoes TEXT DEFAULT '',
  revisao_motivo TEXT DEFAULT '',
  aprovado_por TEXT DEFAULT '',
  data_aprovacao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all orcamentos" ON public.orcamentos FOR ALL TO public USING (true) WITH CHECK (true);
