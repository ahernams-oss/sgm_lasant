CREATE TABLE public.promocoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id text NOT NULL,
  data_promocao date NOT NULL DEFAULT CURRENT_DATE,
  cargo_anterior_id text DEFAULT '',
  cargo_anterior_nome text DEFAULT '',
  cargo_novo_id text NOT NULL,
  cargo_novo_nome text NOT NULL,
  salario_anterior text DEFAULT '',
  salario_novo text DEFAULT '',
  cliente_anterior_id text DEFAULT '',
  cliente_anterior_nome text DEFAULT '',
  cliente_novo_id text DEFAULT '',
  cliente_novo_nome text DEFAULT '',
  motivo text DEFAULT '',
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promocoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura por autenticados" ON public.promocoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inserção por autenticados" ON public.promocoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Deleção por autenticados" ON public.promocoes FOR DELETE TO authenticated USING (true);
CREATE POLICY "Leitura anon" ON public.promocoes FOR SELECT TO anon USING (true);