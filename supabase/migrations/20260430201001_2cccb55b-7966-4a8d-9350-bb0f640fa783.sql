ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS limite_aprovacao_compras numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS limite_aprovacao_os numeric NOT NULL DEFAULT 0;