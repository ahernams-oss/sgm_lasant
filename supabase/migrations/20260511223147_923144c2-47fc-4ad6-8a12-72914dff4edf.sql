CREATE TABLE public.fin_condicoes_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'a_prazo',
  num_parcelas INTEGER NOT NULL DEFAULT 1,
  dias_parcelas JSONB NOT NULL DEFAULT '[]'::jsonb,
  intervalo_dias INTEGER,
  percentual_entrada NUMERIC(5,2) DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_condicoes_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read condicoes pagamento" ON public.fin_condicoes_pagamento FOR SELECT USING (true);
CREATE POLICY "Public insert condicoes pagamento" ON public.fin_condicoes_pagamento FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update condicoes pagamento" ON public.fin_condicoes_pagamento FOR UPDATE USING (true);
CREATE POLICY "Public delete condicoes pagamento" ON public.fin_condicoes_pagamento FOR DELETE USING (true);

CREATE TRIGGER trg_condicoes_pagamento_updated
BEFORE UPDATE ON public.fin_condicoes_pagamento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.fin_condicoes_pagamento (nome, tipo, num_parcelas, dias_parcelas) VALUES
('À Vista', 'a_vista', 1, '[0]'::jsonb),
('30 dias', 'a_prazo', 1, '[30]'::jsonb),
('30/60 dias', 'a_prazo', 2, '[30,60]'::jsonb),
('30/60/90 dias', 'a_prazo', 3, '[30,60,90]'::jsonb);