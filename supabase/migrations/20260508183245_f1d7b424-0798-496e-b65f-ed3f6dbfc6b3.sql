
CREATE TABLE IF NOT EXISTS public.whatsapp_campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  modo TEXT NOT NULL DEFAULT 'imediato', -- imediato | agendado | recorrente
  agendado_para TIMESTAMPTZ,
  recorrencia TEXT, -- diaria | semanal
  dias_semana INTEGER[] DEFAULT '{}', -- 0=domingo .. 6=sábado
  hora_envio TEXT, -- 'HH:MM'
  ativo BOOLEAN NOT NULL DEFAULT true,
  proximo_envio TIMESTAMPTZ,
  ultimo_envio_em TIMESTAMPTZ,
  total_destinatarios INTEGER NOT NULL DEFAULT 0,
  total_sucesso INTEGER NOT NULL DEFAULT 0,
  total_erro INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read whatsapp_campanhas" ON public.whatsapp_campanhas FOR SELECT USING (true);
CREATE POLICY "public insert whatsapp_campanhas" ON public.whatsapp_campanhas FOR INSERT WITH CHECK (true);
CREATE POLICY "public update whatsapp_campanhas" ON public.whatsapp_campanhas FOR UPDATE USING (true);
CREATE POLICY "public delete whatsapp_campanhas" ON public.whatsapp_campanhas FOR DELETE USING (true);

CREATE TRIGGER trg_whatsapp_campanhas_updated_at
BEFORE UPDATE ON public.whatsapp_campanhas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.whatsapp_envios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES public.whatsapp_campanhas(id) ON DELETE CASCADE,
  funcionario_id UUID,
  funcionario_nome TEXT,
  telefone TEXT,
  sucesso BOOLEAN NOT NULL DEFAULT false,
  erro TEXT,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read whatsapp_envios" ON public.whatsapp_envios FOR SELECT USING (true);
CREATE POLICY "public insert whatsapp_envios" ON public.whatsapp_envios FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete whatsapp_envios" ON public.whatsapp_envios FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_whatsapp_envios_campanha ON public.whatsapp_envios(campanha_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_campanhas_proximo ON public.whatsapp_campanhas(proximo_envio) WHERE ativo = true;
