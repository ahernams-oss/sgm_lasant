ALTER TABLE public.juridico_decisoes_pagamentos
ADD COLUMN IF NOT EXISTS anexos JSONB NOT NULL DEFAULT '[]'::jsonb;