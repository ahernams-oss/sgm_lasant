
CREATE TABLE public.juridico_audiencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL,
  processo_numero TEXT NOT NULL DEFAULT '',
  data_audiencia DATE NOT NULL,
  hora TEXT DEFAULT '',
  tipo TEXT DEFAULT 'Audiência Inicial',
  local TEXT DEFAULT '',
  vara TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  status TEXT DEFAULT 'Agendada',
  notificado_5d BOOLEAN NOT NULL DEFAULT false,
  notificado_2d BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.juridico_audiencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all juridico_audiencias" ON public.juridico_audiencias FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.juridico_contatos_notificacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'Advogado',
  telefone_whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  oab TEXT DEFAULT '',
  crc TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.juridico_contatos_notificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all juridico_contatos_notificacao" ON public.juridico_contatos_notificacao FOR ALL USING (true) WITH CHECK (true);
