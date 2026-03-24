
CREATE TABLE public.perfis_acesso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  permissoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.perfis_acesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all perfis_acesso" ON public.perfis_acesso
  FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.usuarios ADD COLUMN perfil_acesso_id text DEFAULT '';
