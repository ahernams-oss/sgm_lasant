CREATE TABLE public.empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL DEFAULT '',
  nome_fantasia text DEFAULT '',
  cnpj text DEFAULT '',
  inscricao_estadual text DEFAULT '',
  inscricao_municipal text DEFAULT '',
  logradouro text DEFAULT '',
  numero text DEFAULT '',
  complemento text DEFAULT '',
  bairro text DEFAULT '',
  cidade text DEFAULT '',
  uf text DEFAULT '',
  cep text DEFAULT '',
  telefone text DEFAULT '',
  celular text DEFAULT '',
  email text DEFAULT '',
  email_compras text DEFAULT '',
  contato text DEFAULT '',
  site text DEFAULT '',
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all empresa" ON public.empresa FOR ALL TO public USING (true) WITH CHECK (true);