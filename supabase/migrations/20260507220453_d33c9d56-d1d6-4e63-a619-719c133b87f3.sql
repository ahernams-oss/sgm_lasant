-- Add calibration fields to equipamentos
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS requer_calibracao boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_calibracao date,
  ADD COLUMN IF NOT EXISTS validade_calibracao date,
  ADD COLUMN IF NOT EXISTS frequencia_calibracao_meses integer,
  ADD COLUMN IF NOT EXISTS certificado_calibracao_url text,
  ADD COLUMN IF NOT EXISTS laboratorio_calibracao text,
  ADD COLUMN IF NOT EXISTS responsavel_calibracao text,
  ADD COLUMN IF NOT EXISTS responsavel_email text,
  ADD COLUMN IF NOT EXISTS responsavel_telefone text,
  ADD COLUMN IF NOT EXISTS notificado_30d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notificado_15d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notificado_7d boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_equipamentos_validade_calibracao
  ON public.equipamentos(validade_calibracao)
  WHERE requer_calibracao = true;

-- History table
CREATE TABLE IF NOT EXISTS public.equipamentos_calibracoes_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid NOT NULL REFERENCES public.equipamentos(id) ON DELETE CASCADE,
  data_calibracao date NOT NULL,
  validade_calibracao date NOT NULL,
  laboratorio text,
  responsavel text,
  certificado_url text,
  observacoes text,
  registrado_por text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calibracoes_hist_equipamento
  ON public.equipamentos_calibracoes_historico(equipamento_id, data_calibracao DESC);

ALTER TABLE public.equipamentos_calibracoes_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read calibracoes_historico"
  ON public.equipamentos_calibracoes_historico FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert calibracoes_historico"
  ON public.equipamentos_calibracoes_historico FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all update calibracoes_historico"
  ON public.equipamentos_calibracoes_historico FOR UPDATE
  USING (true);

CREATE POLICY "Allow all delete calibracoes_historico"
  ON public.equipamentos_calibracoes_historico FOR DELETE
  USING (true);

CREATE TRIGGER update_calibracoes_hist_updated_at
  BEFORE UPDATE ON public.equipamentos_calibracoes_historico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();