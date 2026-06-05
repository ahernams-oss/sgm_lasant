
-- ============ NFS-e Nacional: Tabelas ============

-- Configuração da emissão NFS-e por empresa
CREATE TABLE public.nfse_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  ambiente smallint NOT NULL DEFAULT 2, -- 1=produção, 2=homologação
  serie_padrao text NOT NULL DEFAULT '00001',
  proximo_numero_dps bigint NOT NULL DEFAULT 1,
  regime_tributario text, -- '1'=Simples, '2'=Lucro Presumido, '3'=Lucro Real
  regime_especial text,
  optante_simples boolean NOT NULL DEFAULT false,
  incentivador_cultural boolean NOT NULL DEFAULT false,
  codigo_municipio_prestador text,
  codigo_servico_padrao text, -- item da lista anexa LC 116
  codigo_tributacao_municipio text,
  codigo_nbs text,
  cnae_padrao text,
  aliquota_iss_padrao numeric(7,4),
  iss_retido_padrao boolean NOT NULL DEFAULT false,
  natureza_operacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, ambiente)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfse_config TO authenticated, anon;
GRANT ALL ON public.nfse_config TO service_role;

ALTER TABLE public.nfse_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nfse_config public access" ON public.nfse_config FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_nfse_config_updated_at
  BEFORE UPDATE ON public.nfse_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- NFS-e emitidas (saída)
CREATE TABLE public.nfses_emitidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid,
  ambiente smallint NOT NULL DEFAULT 2,
  serie text NOT NULL DEFAULT '00001',
  numero_dps bigint NOT NULL,
  status text NOT NULL DEFAULT 'rascunho', -- rascunho | processando | emitida | rejeitada | cancelada
  chave_acesso text, -- chave da NFS-e autorizada (50 dígitos)
  protocolo text,
  data_emissao timestamptz,
  data_competencia date,
  cliente_id uuid,
  faturamento_id uuid,
  prestador jsonb NOT NULL DEFAULT '{}'::jsonb,
  tomador jsonb NOT NULL DEFAULT '{}'::jsonb,
  servico jsonb NOT NULL DEFAULT '{}'::jsonb, -- {descricao, codigoServico, codigoTribMunicipio, codigoNbs, valorServico, deducoes, ...}
  tributos jsonb NOT NULL DEFAULT '{}'::jsonb, -- {issRetido, aliquotaIss, valorIss, pis, cofins, inss, ir, csll, ...}
  valor_servico numeric(15,2) NOT NULL DEFAULT 0,
  valor_iss numeric(15,2) NOT NULL DEFAULT 0,
  valor_liquido numeric(15,2) NOT NULL DEFAULT 0,
  xml_dps text,
  xml_nfse text,
  url_danfse text,
  mensagem_retorno text,
  motivo_cancelamento text,
  data_cancelamento timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, ambiente, serie, numero_dps)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfses_emitidas TO authenticated, anon;
GRANT ALL ON public.nfses_emitidas TO service_role;

ALTER TABLE public.nfses_emitidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nfses_emitidas public access" ON public.nfses_emitidas FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_nfses_emitidas_status ON public.nfses_emitidas(status);
CREATE INDEX idx_nfses_emitidas_cliente ON public.nfses_emitidas(cliente_id);
CREATE INDEX idx_nfses_emitidas_data ON public.nfses_emitidas(data_emissao DESC);
CREATE INDEX idx_nfses_emitidas_faturamento ON public.nfses_emitidas(faturamento_id);

CREATE TRIGGER trg_nfses_emitidas_updated_at
  BEFORE UPDATE ON public.nfses_emitidas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger de numeração automática (por empresa+ambiente+serie)
CREATE OR REPLACE FUNCTION public.set_next_nfse_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero_dps IS NULL OR NEW.numero_dps = 0 THEN
    SELECT COALESCE(MAX(numero_dps), 0) + 1 INTO NEW.numero_dps
    FROM public.nfses_emitidas
    WHERE COALESCE(empresa_id::text,'') = COALESCE(NEW.empresa_id::text,'')
      AND ambiente = NEW.ambiente
      AND serie = NEW.serie;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_next_nfse_numero
  BEFORE INSERT ON public.nfses_emitidas
  FOR EACH ROW EXECUTE FUNCTION public.set_next_nfse_numero();
