ALTER TABLE public.juridico_decisoes_pagamentos
ADD COLUMN IF NOT EXISTS valor_entrada NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_entrada DATE;