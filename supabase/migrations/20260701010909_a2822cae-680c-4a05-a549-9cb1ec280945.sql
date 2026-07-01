CREATE TABLE IF NOT EXISTS public.mfa_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  purpose text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  telefone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mfa_otps_usuario_purpose ON public.mfa_otps (usuario_id, purpose, created_at DESC);
GRANT ALL ON public.mfa_otps TO service_role;
ALTER TABLE public.mfa_otps ENABLE ROW LEVEL SECURITY;