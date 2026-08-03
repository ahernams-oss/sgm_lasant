CREATE OR REPLACE FUNCTION public.set_next_rdo_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    IF NEW.obra_id IS NOT NULL THEN
      SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.rdos WHERE obra_id = NEW.obra_id;
    ELSE
      SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.rdos WHERE cliente_id = NEW.cliente_id AND obra = NEW.obra;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_rdos_numero_obra_id ON public.rdos(obra_id, numero);
CREATE INDEX IF NOT EXISTS idx_rdos_numero_cliente_obra ON public.rdos(cliente_id, obra, numero);