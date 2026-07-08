
CREATE TABLE public.equipamentos_laudos_condenacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INT NOT NULL DEFAULT 0,
  equipamento_id UUID,
  equipamento_tag TEXT,
  equipamento_nome TEXT,
  tipo TEXT,
  marca TEXT,
  modelo TEXT,
  serie TEXT,
  patrimonio TEXT,
  ano_fabricacao TEXT,
  data_aquisicao DATE,
  localizacao TEXT,
  estado_conservacao TEXT,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_inspecao DATE,
  local_inspecao TEXT,
  responsavel_tecnico TEXT,
  registro_profissional TEXT,
  historico TEXT,
  insp_condicoes_fisicas TEXT,
  insp_condicoes_eletricas TEXT,
  insp_condicoes_mecanicas TEXT,
  insp_funcionalidade TEXT,
  motivos_condenacao JSONB NOT NULL DEFAULT '[]'::jsonb,
  custo_reparo NUMERIC,
  valor_residual NUMERIC,
  valor_novo_equivalente NUMERIC,
  parecer TEXT,
  conclusao_condicoes TEXT,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  anexos_orcamentos JSONB NOT NULL DEFAULT '[]'::jsonb,
  outros_anexos JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes_outros TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos_laudos_condenacao TO authenticated;
GRANT SELECT ON public.equipamentos_laudos_condenacao TO anon;
GRANT ALL ON public.equipamentos_laudos_condenacao TO service_role;

ALTER TABLE public.equipamentos_laudos_condenacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on laudos condenacao"
  ON public.equipamentos_laudos_condenacao
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_laudos_condenacao_equipamento ON public.equipamentos_laudos_condenacao(equipamento_id);

CREATE OR REPLACE FUNCTION public.set_next_laudo_condenacao_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_year INT;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::INT;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.equipamentos_laudos_condenacao
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::INT = v_year;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_laudo_condenacao_numero
  BEFORE INSERT ON public.equipamentos_laudos_condenacao
  FOR EACH ROW EXECUTE FUNCTION public.set_next_laudo_condenacao_numero();

CREATE TRIGGER trg_laudo_condenacao_updated
  BEFORE UPDATE ON public.equipamentos_laudos_condenacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
