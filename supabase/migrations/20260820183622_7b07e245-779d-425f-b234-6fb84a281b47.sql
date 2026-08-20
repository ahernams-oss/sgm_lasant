ALTER TABLE public.epis_devolucoes
  ADD COLUMN IF NOT EXISTS token text UNIQUE,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'registrado',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS telefone_envio text,
  ADD COLUMN IF NOT EXISTS cpf_verificado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verificado_em timestamptz,
  ADD COLUMN IF NOT EXISTS confirmado_em timestamptz,
  ADD COLUMN IF NOT EXISTS selfie_path text,
  ADD COLUMN IF NOT EXISTS selfie_hash text,
  ADD COLUMN IF NOT EXISTS selfie_path_2 text,
  ADD COLUMN IF NOT EXISTS selfie_hash_2 text,
  ADD COLUMN IF NOT EXISTS ip text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS epis_devolucoes_token_idx ON public.epis_devolucoes (token);