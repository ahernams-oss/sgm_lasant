
-- ============================================================
-- Marcações de ponto importadas do Pontomais
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ponto_marcacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  cpf TEXT,
  pontomais_employee_id BIGINT,
  pontomais_time_card_id BIGINT,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  endereco TEXT,
  origem TEXT,
  hash TEXT NOT NULL UNIQUE,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ponto_marcacoes_funcionario ON public.ponto_marcacoes(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_ponto_marcacoes_data_hora ON public.ponto_marcacoes(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_ponto_marcacoes_cpf ON public.ponto_marcacoes(cpf);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ponto_marcacoes TO anon, authenticated;
GRANT ALL ON public.ponto_marcacoes TO service_role;
ALTER TABLE public.ponto_marcacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ponto_marcacoes_public_all" ON public.ponto_marcacoes FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_ponto_marcacoes_updated BEFORE UPDATE ON public.ponto_marcacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Espelho diário por funcionário
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ponto_espelho_dia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  cpf TEXT,
  pontomais_employee_id BIGINT,
  data DATE NOT NULL,
  horas_trabalhadas_min INT DEFAULT 0,
  horas_extras_min INT DEFAULT 0,
  horas_faltantes_min INT DEFAULT 0,
  atrasos_min INT DEFAULT 0,
  saldo_min INT DEFAULT 0,
  status TEXT,
  observacao TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cpf, data)
);
CREATE INDEX IF NOT EXISTS idx_ponto_espelho_funcionario ON public.ponto_espelho_dia(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_ponto_espelho_data ON public.ponto_espelho_dia(data DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ponto_espelho_dia TO anon, authenticated;
GRANT ALL ON public.ponto_espelho_dia TO service_role;
ALTER TABLE public.ponto_espelho_dia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ponto_espelho_public_all" ON public.ponto_espelho_dia FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_ponto_espelho_updated BEFORE UPDATE ON public.ponto_espelho_dia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Log de sincronizações
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ponto_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  periodo_ini DATE,
  periodo_fim DATE,
  origem TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'em_andamento',
  total_funcionarios INT DEFAULT 0,
  total_funcionarios_vinculados INT DEFAULT 0,
  total_marcacoes INT DEFAULT 0,
  total_espelhos INT DEFAULT 0,
  mensagem TEXT,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ponto_sync_log_iniciado ON public.ponto_sync_log(iniciado_em DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ponto_sync_log TO anon, authenticated;
GRANT ALL ON public.ponto_sync_log TO service_role;
ALTER TABLE public.ponto_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ponto_sync_log_public_all" ON public.ponto_sync_log FOR ALL USING (true) WITH CHECK (true);
