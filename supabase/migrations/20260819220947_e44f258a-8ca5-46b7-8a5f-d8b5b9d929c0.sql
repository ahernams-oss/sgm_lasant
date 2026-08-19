CREATE TABLE public.material_sco_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL,
  sco_id uuid,
  cod_sco text NOT NULL,
  descricao_sco text NOT NULL DEFAULT '',
  unidade_sco text NOT NULL DEFAULT '',
  fator_conversao numeric NOT NULL DEFAULT 1,
  padrao boolean NOT NULL DEFAULT false,
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, cod_sco)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_sco_vinculos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_sco_vinculos TO anon;
GRANT ALL ON public.material_sco_vinculos TO service_role;

ALTER TABLE public.material_sco_vinculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "material_sco_vinculos_all" ON public.material_sco_vinculos
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_material_sco_vinculos_updated
BEFORE UPDATE ON public.material_sco_vinculos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_material_sco_vinculos_material ON public.material_sco_vinculos (material_id);

ALTER TABLE public.estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS cod_sco text,
  ADD COLUMN IF NOT EXISTS descricao_sco text,
  ADD COLUMN IF NOT EXISTS quantidade_sco numeric,
  ADD COLUMN IF NOT EXISTS fator_conversao numeric;