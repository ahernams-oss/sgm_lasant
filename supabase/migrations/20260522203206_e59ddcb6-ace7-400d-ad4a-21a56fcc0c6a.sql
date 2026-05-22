CREATE TABLE IF NOT EXISTS public.requisicoes_compras_justificativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motivo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.requisicoes_compras_justificativas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can select" ON public.requisicoes_compras_justificativas FOR SELECT USING (true);
CREATE POLICY "Public can insert" ON public.requisicoes_compras_justificativas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update" ON public.requisicoes_compras_justificativas FOR UPDATE USING (true);
CREATE POLICY "Public can delete" ON public.requisicoes_compras_justificativas FOR DELETE USING (true);

INSERT INTO public.requisicoes_compras_justificativas (motivo) VALUES
  ('Itens com descrição incorreta'),
  ('Quantidade divergente do necessário'),
  ('Especificação técnica insuficiente'),
  ('Falta de justificativa adequada'),
  ('Centro de custo incorreto')
ON CONFLICT (motivo) DO NOTHING;