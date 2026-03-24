
-- Tabela de movimentações de estoque
CREATE TABLE public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id text NOT NULL DEFAULT '',
  material_codigo text NOT NULL DEFAULT '',
  material_descricao text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'entrada',
  quantidade numeric NOT NULL DEFAULT 0,
  local text NOT NULL DEFAULT '',
  documento_ref text DEFAULT '',
  observacao text DEFAULT '',
  usuario text DEFAULT '',
  data_movimentacao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all estoque_mov" ON public.estoque_movimentacoes FOR ALL TO public USING (true) WITH CHECK (true);

-- Tabela de inventários
CREATE TABLE public.estoque_inventarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_inventario text DEFAULT '',
  local text NOT NULL DEFAULT '',
  status text DEFAULT 'Aberto',
  itens jsonb DEFAULT '[]'::jsonb,
  usuario text DEFAULT '',
  observacao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.estoque_inventarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all estoque_inv" ON public.estoque_inventarios FOR ALL TO public USING (true) WITH CHECK (true);

-- Adicionar estoque_minimo em materiais_servicos
ALTER TABLE public.materiais_servicos ADD COLUMN IF NOT EXISTS estoque_minimo numeric DEFAULT 0;
