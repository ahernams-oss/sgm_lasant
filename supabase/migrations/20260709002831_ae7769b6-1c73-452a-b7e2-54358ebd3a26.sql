
CREATE TABLE public.contrato_transferencias_saldo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_saldo TEXT NOT NULL CHECK (tipo_saldo IN ('maoDeObraMensal','maoDeObraAnual','maoDeObraContratual','valorVariavel')),
  valor NUMERIC(18,2) NOT NULL CHECK (valor > 0),
  cliente_origem_id UUID NOT NULL,
  cliente_origem_nome TEXT,
  contrato_origem_id TEXT NOT NULL,
  contrato_origem_numero TEXT,
  saldo_origem_antes NUMERIC(18,2),
  saldo_origem_depois NUMERIC(18,2),
  cliente_destino_id UUID NOT NULL,
  cliente_destino_nome TEXT,
  contrato_destino_id TEXT NOT NULL,
  contrato_destino_numero TEXT,
  saldo_destino_antes NUMERIC(18,2),
  saldo_destino_depois NUMERIC(18,2),
  motivo TEXT,
  usuario_id UUID,
  usuario_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_transferencias_saldo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contrato_transferencias_saldo TO anon;
GRANT ALL ON public.contrato_transferencias_saldo TO service_role;

ALTER TABLE public.contrato_transferencias_saldo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ler transferencias saldo"
  ON public.contrato_transferencias_saldo FOR SELECT USING (true);
CREATE POLICY "Todos podem inserir transferencias saldo"
  ON public.contrato_transferencias_saldo FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar transferencias saldo"
  ON public.contrato_transferencias_saldo FOR UPDATE USING (true);
CREATE POLICY "Todos podem deletar transferencias saldo"
  ON public.contrato_transferencias_saldo FOR DELETE USING (true);

CREATE INDEX idx_ctransf_origem ON public.contrato_transferencias_saldo (cliente_origem_id, contrato_origem_id);
CREATE INDEX idx_ctransf_destino ON public.contrato_transferencias_saldo (cliente_destino_id, contrato_destino_id);
CREATE INDEX idx_ctransf_data ON public.contrato_transferencias_saldo (data DESC);
