
CREATE TABLE public.login_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NULL,
  email TEXT NOT NULL,
  nome TEXT NULL,
  sucesso BOOLEAN NOT NULL,
  motivo TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_auditoria_created_at ON public.login_auditoria (created_at DESC);
CREATE INDEX idx_login_auditoria_email ON public.login_auditoria (email);
CREATE INDEX idx_login_auditoria_usuario_id ON public.login_auditoria (usuario_id);

ALTER TABLE public.login_auditoria ENABLE ROW LEVEL SECURITY;

-- App usa auth pública (anon). Permitir leitura por anon (controle de UI por permissão).
CREATE POLICY "Leitura pública auditoria login"
  ON public.login_auditoria
  FOR SELECT
  USING (true);

-- Inserção feita exclusivamente via Edge Function (service_role bypassa RLS),
-- portanto não criamos policy de INSERT para anon.
