ALTER TABLE public.rdos ADD COLUMN IF NOT EXISTS obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rdos_obra_id ON public.rdos(obra_id);

-- Backfill: tenta vincular pelo par (cliente_id, nome da obra)
UPDATE public.rdos r
SET obra_id = o.id
FROM public.obras o
WHERE r.obra_id IS NULL
  AND r.cliente_id = o.cliente_id
  AND lower(trim(r.obra)) = lower(trim(o.nome));