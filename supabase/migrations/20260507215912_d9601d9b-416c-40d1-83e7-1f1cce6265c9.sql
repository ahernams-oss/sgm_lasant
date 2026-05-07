
ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS requer_calibracao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_calibracao date,
  ADD COLUMN IF NOT EXISTS validade_calibracao date,
  ADD COLUMN IF NOT EXISTS frequencia_calibracao_meses integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS certificado_calibracao_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS laboratorio_calibracao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS numero_certificado_calibracao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS observacoes_calibracao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_calibracao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefone_responsavel_calibracao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_responsavel_calibracao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS calibracao_notificado_30d boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibracao_notificado_15d boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibracao_notificado_7d boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.equipamentos_calibracoes_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid NOT NULL,
  equipamento_nome text NOT NULL DEFAULT '',
  equipamento_tag text DEFAULT '',
  data_calibracao date NOT NULL,
  validade_calibracao date,
  laboratorio text DEFAULT '',
  numero_certificado text DEFAULT '',
  certificado_url text DEFAULT '',
  responsavel text DEFAULT '',
  resultado text DEFAULT 'Aprovado',
  observacoes text DEFAULT '',
  custo numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipamentos_calibracoes_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all equipamentos_calibracoes_historico"
  ON public.equipamentos_calibracoes_historico FOR ALL
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_calib_hist_equip ON public.equipamentos_calibracoes_historico(equipamento_id);
CREATE INDEX IF NOT EXISTS idx_equip_validade_calib ON public.equipamentos(validade_calibracao) WHERE requer_calibracao = true;
