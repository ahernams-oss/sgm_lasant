
CREATE TABLE public.portal_holerites_import_lote (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arquivo_nome TEXT NOT NULL,
  competencia_mes INT NOT NULL,
  competencia_ano INT NOT NULL,
  total_paginas INT NOT NULL DEFAULT 0,
  total_publicados INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'conferencia',
  importado_por UUID,
  importado_por_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_holerites_import_lote TO authenticated, anon;
GRANT ALL ON public.portal_holerites_import_lote TO service_role;
ALTER TABLE public.portal_holerites_import_lote ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lote all" ON public.portal_holerites_import_lote FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.portal_holerites_import_item (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lote_id UUID NOT NULL REFERENCES public.portal_holerites_import_lote(id) ON DELETE CASCADE,
  pagina INT NOT NULL,
  cpf_detectado TEXT,
  nome_detectado TEXT,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'folha',
  valor_liquido NUMERIC(14,2),
  status_match TEXT NOT NULL DEFAULT 'nao_encontrado',
  ignorar BOOLEAN NOT NULL DEFAULT false,
  publicado BOOLEAN NOT NULL DEFAULT false,
  pdf_pagina_base64 TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_holerites_import_item_lote ON public.portal_holerites_import_item(lote_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_holerites_import_item TO authenticated, anon;
GRANT ALL ON public.portal_holerites_import_item TO service_role;
ALTER TABLE public.portal_holerites_import_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "item all" ON public.portal_holerites_import_item FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_upd_lote BEFORE UPDATE ON public.portal_holerites_import_lote FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_upd_item BEFORE UPDATE ON public.portal_holerites_import_item FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
