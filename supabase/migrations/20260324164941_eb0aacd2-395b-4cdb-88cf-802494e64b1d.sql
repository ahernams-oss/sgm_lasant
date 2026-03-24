
-- Create table for periodic exams
CREATE TABLE public.exames_periodicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id TEXT NOT NULL,
  funcionario_nome TEXT NOT NULL,
  funcionario_telefone TEXT DEFAULT '',
  funcionario_email TEXT DEFAULT '',
  tipo_exame TEXT NOT NULL,
  data_realizacao DATE,
  data_vencimento DATE NOT NULL,
  resultado TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  clinica TEXT DEFAULT '',
  anexo_aso_url TEXT DEFAULT '',
  notificado_30d BOOLEAN NOT NULL DEFAULT false,
  notificado_20d BOOLEAN NOT NULL DEFAULT false,
  notificado_10d BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exames_periodicos ENABLE ROW LEVEL SECURITY;

-- RLS policies (authenticated users can CRUD)
CREATE POLICY "Leitura por autenticados" ON public.exames_periodicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserção por autenticados" ON public.exames_periodicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Atualização por autenticados" ON public.exames_periodicos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deleção por autenticados" ON public.exames_periodicos FOR DELETE TO authenticated USING (true);

-- Also allow anon for edge function cron access
CREATE POLICY "Leitura anon" ON public.exames_periodicos FOR SELECT TO anon USING (true);
CREATE POLICY "Atualização anon" ON public.exames_periodicos FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
