
-- Contratos de Terceiro (prestadores de serviço)
CREATE TABLE IF NOT EXISTS public.contratos_terceiros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER,
  fornecedor_id UUID,
  fornecedor_nome TEXT,
  fornecedor_cnpj TEXT,
  cliente_id UUID,
  cliente_nome TEXT,
  obra_id UUID,
  obra_nome TEXT,
  objeto TEXT NOT NULL,
  valor NUMERIC(14,2) DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  aditivos JSONB NOT NULL DEFAULT '[]'::jsonb,
  medicoes_vinculadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  anexos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contratos_terceiros TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_terceiros TO authenticated, anon;
GRANT ALL ON public.contratos_terceiros TO service_role;

ALTER TABLE public.contratos_terceiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contratos_terceiros_all" ON public.contratos_terceiros
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER trg_contratos_terceiros_updated_at
  BEFORE UPDATE ON public.contratos_terceiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger numeração sequencial anual
CREATE OR REPLACE FUNCTION public.set_next_contrato_terceiro_numero()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.contratos_terceiros
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_contratos_terceiros_numero
  BEFORE INSERT ON public.contratos_terceiros
  FOR EACH ROW EXECUTE FUNCTION public.set_next_contrato_terceiro_numero();
