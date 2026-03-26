
CREATE TABLE public.medicoes_servicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  numero integer NOT NULL DEFAULT 0,
  cliente_id text DEFAULT '',
  cliente_nome text DEFAULT '',
  contrato text DEFAULT '',
  descricao text DEFAULT '',
  status text DEFAULT 'Em Andamento',
  valor_total_contratado numeric DEFAULT 0,
  valor_total_medido numeric DEFAULT 0,
  percentual_medido numeric DEFAULT 0,
  itens jsonb DEFAULT '[]'::jsonb,
  medicoes jsonb DEFAULT '[]'::jsonb,
  observacoes text DEFAULT ''
);

ALTER TABLE public.medicoes_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all medicoes_servicos" ON public.medicoes_servicos
  FOR ALL TO public USING (true) WITH CHECK (true);
