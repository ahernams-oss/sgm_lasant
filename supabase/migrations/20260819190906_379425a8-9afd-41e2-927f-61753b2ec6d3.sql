CREATE TABLE public.nrs_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  descricao text NOT NULL,
  data_validade date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nrs_catalogo TO authenticated;
GRANT ALL ON public.nrs_catalogo TO service_role;

ALTER TABLE public.nrs_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver NRs" ON public.nrs_catalogo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Autenticados podem criar NRs" ON public.nrs_catalogo FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados podem editar NRs" ON public.nrs_catalogo FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados podem excluir NRs" ON public.nrs_catalogo FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_nrs_catalogo_updated
BEFORE UPDATE ON public.nrs_catalogo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();