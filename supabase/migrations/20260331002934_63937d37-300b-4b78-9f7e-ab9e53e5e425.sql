
CREATE TABLE public.equipamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  cliente_id text DEFAULT '',
  cliente_nome text DEFAULT '',
  local_id text DEFAULT '',
  local_descricao text DEFAULT '',
  pavimento_id text DEFAULT '',
  pavimento_descricao text DEFAULT '',
  setor_id text DEFAULT '',
  setor_descricao text DEFAULT '',
  situacao text DEFAULT 'Ativo',
  tag text DEFAULT '',
  equipamento text DEFAULT '',
  serie text DEFAULT '',
  grupo text DEFAULT '',
  subgrupo text DEFAULT '',
  modelo text DEFAULT '',
  valor numeric DEFAULT 0,
  fabricante text DEFAULT '',
  data_aquisicao text DEFAULT '',
  nivel_risco text DEFAULT '',
  nivel_manutencao text DEFAULT '',
  expectativa_vida text DEFAULT '',
  data_garantia text DEFAULT '',
  tensao text DEFAULT '',
  corrente text DEFAULT '',
  potencia text DEFAULT '',
  capacidade_btu text DEFAULT '',
  contrato text DEFAULT '',
  plano_manutencao text DEFAULT '',
  numero_anvisa text DEFAULT '',
  foto_url text DEFAULT '',
  manual_url text DEFAULT ''
);

ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all equipamentos" ON public.equipamentos FOR ALL TO public USING (true) WITH CHECK (true);
