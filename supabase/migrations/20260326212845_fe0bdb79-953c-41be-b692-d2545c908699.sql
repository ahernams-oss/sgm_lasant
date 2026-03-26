CREATE TABLE public.licitacoes_telefones_notificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL DEFAULT '',
  nome_contato text NOT NULL DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.licitacoes_telefones_notificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all licitacoes_telefones" ON public.licitacoes_telefones_notificacao
  FOR ALL TO public USING (true) WITH CHECK (true);