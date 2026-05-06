
-- Catálogo de itens elementares (FGV04)
CREATE TABLE public.sco_elementares (
  codigo TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  unidade TEXT,
  grupo TEXT,
  reutilizado TEXT,
  preco NUMERIC(14,4) NOT NULL DEFAULT 0,
  referencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sco_elem_descricao ON public.sco_elementares USING gin (to_tsvector('portuguese', descricao));
CREATE INDEX idx_sco_elem_grupo ON public.sco_elementares (grupo);

-- Catálogo de itens de serviço (FGV06)
CREATE TABLE public.sco_servicos (
  codigo TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  unidade TEXT,
  preco NUMERIC(14,4) NOT NULL DEFAULT 0,
  capitulo TEXT,
  capitulo_descricao TEXT,
  secao TEXT,
  secao_descricao TEXT,
  subsecao TEXT,
  subsecao_descricao TEXT,
  referencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sco_serv_descricao ON public.sco_servicos USING gin (to_tsvector('portuguese', descricao));
CREATE INDEX idx_sco_serv_capitulo ON public.sco_servicos (capitulo);

-- Composições analíticas (FGV07)
CREATE TABLE public.sco_composicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_codigo TEXT NOT NULL,
  elementar_codigo TEXT,
  elementar_descricao TEXT,
  unidade TEXT,
  reutilizado TEXT,
  quantidade NUMERIC(18,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sco_comp_servico ON public.sco_composicoes (servico_codigo);
CREATE INDEX idx_sco_comp_elementar ON public.sco_composicoes (elementar_codigo);

-- Orçamentos
CREATE TABLE public.orcamentos_sco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL DEFAULT 0,
  titulo TEXT NOT NULL,
  cliente_id UUID,
  cliente_nome TEXT,
  obra TEXT,
  tipo_analise TEXT NOT NULL DEFAULT 'sintetica',
  bdi NUMERIC(7,4) NOT NULL DEFAULT 0,
  desconto NUMERIC(7,4) NOT NULL DEFAULT 0,
  observacoes TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Em elaboração',
  criado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orc_sco_numero ON public.orcamentos_sco (numero);

-- Trigger numeração anual
CREATE OR REPLACE FUNCTION public.set_next_orcamento_sco_numero()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.orcamentos_sco
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_orc_sco_numero BEFORE INSERT ON public.orcamentos_sco
FOR EACH ROW EXECUTE FUNCTION public.set_next_orcamento_sco_numero();

CREATE TRIGGER trg_orc_sco_updated BEFORE UPDATE ON public.orcamentos_sco
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS pública (padrão do projeto)
ALTER TABLE public.sco_elementares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sco_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sco_composicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos_sco ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_sco_elementares" ON public.sco_elementares FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_sco_servicos" ON public.sco_servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_sco_composicoes" ON public.sco_composicoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_orcamentos_sco" ON public.orcamentos_sco FOR ALL USING (true) WITH CHECK (true);
