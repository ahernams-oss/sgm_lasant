ALTER TABLE public.juridico_audiencias
  ADD COLUMN IF NOT EXISTS notificado_10d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notificado_7d boolean NOT NULL DEFAULT false;