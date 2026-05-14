
-- Tabela de NFes recebidas (dados retornados pela Focus NFe)
CREATE TABLE IF NOT EXISTS public.nfes_recebidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  chave TEXT NOT NULL UNIQUE,
  numero TEXT,
  serie TEXT,
  emitente_cnpj TEXT,
  emitente_nome TEXT,
  destinatario_cnpj TEXT,
  valor_total NUMERIC(15,2),
  data_emissao TIMESTAMPTZ,
  data_recebimento TIMESTAMPTZ,
  ambiente TEXT,
  status TEXT,
  manifestacao TEXT,
  xml_url TEXT,
  danfe_url TEXT,
  pedido_compra_id UUID,
  vinculado_em TIMESTAMPTZ,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nfes_recebidas_emp ON public.nfes_recebidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfes_recebidas_data ON public.nfes_recebidas(data_emissao DESC);

ALTER TABLE public.nfes_recebidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nfes_recebidas_all" ON public.nfes_recebidas;
CREATE POLICY "nfes_recebidas_all" ON public.nfes_recebidas FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER nfes_recebidas_updated_at
BEFORE UPDATE ON public.nfes_recebidas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket privado para XMLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('nfes-xml', 'nfes-xml', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "nfes_xml_all" ON storage.objects;
CREATE POLICY "nfes_xml_all" ON storage.objects FOR ALL
USING (bucket_id = 'nfes-xml') WITH CHECK (bucket_id = 'nfes-xml');
