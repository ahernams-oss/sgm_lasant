
-- Decisões judiciais e Acordos com programação de parcelas
CREATE TABLE public.juridico_decisoes_pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL REFERENCES public.processos_trabalhistas(id) ON DELETE CASCADE,
  processo_numero TEXT,
  tipo TEXT NOT NULL DEFAULT 'Acordo', -- Decisão / Acordo / Sentença / Homologação
  data_decisao DATE,
  juiz TEXT,
  descricao TEXT,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_principal NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_honorarios NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_custas NUMERIC(14,2) NOT NULL DEFAULT 0,
  qtd_parcelas INT NOT NULL DEFAULT 1,
  primeiro_vencimento DATE,
  status TEXT NOT NULL DEFAULT 'Em andamento', -- Em andamento / Quitado / Inadimplente / Cancelado
  -- Patrono da causa do autor
  patrono_nome TEXT,
  patrono_oab TEXT,
  patrono_telefone TEXT,
  patrono_email TEXT,
  patrono_escritorio TEXT,
  -- Dados bancários para pagamento
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT, -- Corrente / Poupança
  pix_chave TEXT,
  pix_tipo TEXT, -- CPF / CNPJ / E-mail / Telefone / Aleatória
  titular_nome TEXT,
  titular_documento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.juridico_parcelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decisao_id UUID NOT NULL REFERENCES public.juridico_decisoes_pagamentos(id) ON DELETE CASCADE,
  numero INT NOT NULL DEFAULT 1,
  data_vencimento DATE,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pendente', -- Pendente / Pago / Atrasado / Cancelado
  data_pagamento DATE,
  valor_pago NUMERIC(14,2),
  forma_pagamento TEXT,
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_juridico_decisoes_processo ON public.juridico_decisoes_pagamentos(processo_id);
CREATE INDEX idx_juridico_parcelas_decisao ON public.juridico_parcelas(decisao_id);

ALTER TABLE public.juridico_decisoes_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.juridico_parcelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_juridico_decisoes" ON public.juridico_decisoes_pagamentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_juridico_parcelas" ON public.juridico_parcelas FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_juridico_decisoes_updated BEFORE UPDATE ON public.juridico_decisoes_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_juridico_parcelas_updated BEFORE UPDATE ON public.juridico_parcelas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
