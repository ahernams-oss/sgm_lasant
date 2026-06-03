-- Add EPIs padrão (lista pré-cadastrada) por cargo
ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS epis_padrao jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Catálogo de EPIs
CREATE TABLE public.epis_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text,
  descricao text NOT NULL,
  ca text,
  validade_meses integer,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis_catalogo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis_catalogo TO authenticated;
GRANT ALL ON public.epis_catalogo TO service_role;

ALTER TABLE public.epis_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epis_catalogo public read" ON public.epis_catalogo FOR SELECT USING (true);
CREATE POLICY "epis_catalogo public insert" ON public.epis_catalogo FOR INSERT WITH CHECK (true);
CREATE POLICY "epis_catalogo public update" ON public.epis_catalogo FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "epis_catalogo public delete" ON public.epis_catalogo FOR DELETE USING (true);

CREATE TRIGGER trg_epis_catalogo_updated_at
BEFORE UPDATE ON public.epis_catalogo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();