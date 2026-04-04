
-- Conversas (diretas ou em grupo)
CREATE TABLE public.comunicacao_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'direta',
  titulo text DEFAULT '',
  criado_por text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.comunicacao_conversas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all comunicacao_conversas" ON public.comunicacao_conversas FOR ALL TO public USING (true) WITH CHECK (true);

-- Participantes de cada conversa
CREATE TABLE public.comunicacao_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid REFERENCES public.comunicacao_conversas(id) ON DELETE CASCADE NOT NULL,
  usuario_nome text NOT NULL DEFAULT '',
  usuario_email text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.comunicacao_participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all comunicacao_participantes" ON public.comunicacao_participantes FOR ALL TO public USING (true) WITH CHECK (true);

-- Mensagens dentro de conversas
CREATE TABLE public.comunicacao_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid REFERENCES public.comunicacao_conversas(id) ON DELETE CASCADE NOT NULL,
  remetente_nome text NOT NULL DEFAULT '',
  remetente_email text DEFAULT '',
  conteudo text NOT NULL DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.comunicacao_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all comunicacao_mensagens" ON public.comunicacao_mensagens FOR ALL TO public USING (true) WITH CHECK (true);

-- Avisos/Comunicados institucionais
CREATE TABLE public.comunicacao_avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL DEFAULT '',
  conteudo text NOT NULL DEFAULT '',
  prioridade text DEFAULT 'Normal',
  criado_por text DEFAULT '',
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.comunicacao_avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all comunicacao_avisos" ON public.comunicacao_avisos FOR ALL TO public USING (true) WITH CHECK (true);

-- Confirmações de leitura dos avisos
CREATE TABLE public.comunicacao_avisos_leitura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aviso_id uuid REFERENCES public.comunicacao_avisos(id) ON DELETE CASCADE NOT NULL,
  usuario_nome text NOT NULL DEFAULT '',
  usuario_email text DEFAULT '',
  lido_em timestamp with time zone DEFAULT now()
);
ALTER TABLE public.comunicacao_avisos_leitura ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all comunicacao_avisos_leitura" ON public.comunicacao_avisos_leitura FOR ALL TO public USING (true) WITH CHECK (true);

-- Notificações de tarefas
CREATE TABLE public.comunicacao_notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_nome text NOT NULL DEFAULT '',
  destinatario_email text DEFAULT '',
  titulo text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  tipo text DEFAULT 'tarefa',
  lida boolean DEFAULT false,
  criado_por text DEFAULT '',
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.comunicacao_notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all comunicacao_notificacoes" ON public.comunicacao_notificacoes FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicacao_mensagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicacao_avisos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicacao_notificacoes;
