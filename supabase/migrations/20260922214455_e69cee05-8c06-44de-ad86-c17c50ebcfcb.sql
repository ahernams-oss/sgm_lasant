CREATE TABLE public.fin_fluxo_ajustes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida')),
  descricao text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  conta_bancaria_id uuid REFERENCES public.fin_contas_bancarias(id) ON DELETE SET NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_fluxo_ajustes TO anon, authenticated;
GRANT ALL ON public.fin_fluxo_ajustes TO service_role;
ALTER TABLE public.fin_fluxo_ajustes ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_select_fin_fluxo_ajustes ON public.fin_fluxo_ajustes FOR SELECT USING (true);
CREATE POLICY public_insert_fin_fluxo_ajustes ON public.fin_fluxo_ajustes FOR INSERT WITH CHECK (true);
CREATE POLICY public_update_fin_fluxo_ajustes ON public.fin_fluxo_ajustes FOR UPDATE USING (true);
CREATE POLICY public_delete_fin_fluxo_ajustes ON public.fin_fluxo_ajustes FOR DELETE USING (true);
CREATE INDEX idx_fin_fluxo_ajustes_data ON public.fin_fluxo_ajustes(data);

CREATE TABLE public.fin_fluxo_saldo_inicial (
  chave text PRIMARY KEY,
  valor numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fin_fluxo_saldo_inicial TO anon, authenticated;
GRANT ALL ON public.fin_fluxo_saldo_inicial TO service_role;
ALTER TABLE public.fin_fluxo_saldo_inicial ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_select_fin_fluxo_saldo_inicial ON public.fin_fluxo_saldo_inicial FOR SELECT USING (true);
CREATE POLICY public_insert_fin_fluxo_saldo_inicial ON public.fin_fluxo_saldo_inicial FOR INSERT WITH CHECK (true);
CREATE POLICY public_update_fin_fluxo_saldo_inicial ON public.fin_fluxo_saldo_inicial FOR UPDATE USING (true);
CREATE POLICY public_delete_fin_fluxo_saldo_inicial ON public.fin_fluxo_saldo_inicial FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_fin_fluxo_ajustes_updated BEFORE UPDATE ON public.fin_fluxo_ajustes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fin_fluxo_saldo_inicial_updated BEFORE UPDATE ON public.fin_fluxo_saldo_inicial FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();