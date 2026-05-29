
CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NULL,
  usuario_nome TEXT NULL,
  usuario_email TEXT NULL,
  modulo TEXT NOT NULL,
  acao TEXT NOT NULL,
  entidade_id TEXT NULL,
  entidade_descricao TEXT NULL,
  dados_antes JSONB NULL,
  dados_depois JSONB NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auditoria_created_at ON public.auditoria (created_at DESC);
CREATE INDEX idx_auditoria_modulo ON public.auditoria (modulo);
CREATE INDEX idx_auditoria_usuario_id ON public.auditoria (usuario_id);
CREATE INDEX idx_auditoria_acao ON public.auditoria (acao);

GRANT SELECT, INSERT ON public.auditoria TO anon;
GRANT SELECT, INSERT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- App usa auth pública (anon). Leitura controlada por permissão no UI.
CREATE POLICY "Leitura auditoria"
  ON public.auditoria
  FOR SELECT
  USING (true);

CREATE POLICY "Insercao auditoria"
  ON public.auditoria
  FOR INSERT
  WITH CHECK (true);
