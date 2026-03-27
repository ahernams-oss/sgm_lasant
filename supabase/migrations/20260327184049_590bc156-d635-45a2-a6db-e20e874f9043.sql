ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS experiencia_inicio date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS experiencia_primeira_etapa date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS experiencia_fim date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS experiencia_renovado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS experiencia_notificado_10d_primeira boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS experiencia_notificado_10d_final boolean DEFAULT false;