ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS codigo integer;

-- Backfill por tipo, na ordem de criação
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY COALESCE(tipo,'Cliente') ORDER BY created_at, id) AS rn
  FROM public.clientes
)
UPDATE public.clientes c SET codigo = r.rn FROM ranked r WHERE c.id = r.id AND c.codigo IS NULL;

CREATE OR REPLACE FUNCTION public.set_next_cliente_codigo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    SELECT COALESCE(MAX(codigo), 0) + 1 INTO NEW.codigo
    FROM public.clientes
    WHERE COALESCE(tipo,'Cliente') = COALESCE(NEW.tipo,'Cliente');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_next_cliente_codigo ON public.clientes;
CREATE TRIGGER trg_set_next_cliente_codigo
BEFORE INSERT ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.set_next_cliente_codigo();

CREATE UNIQUE INDEX IF NOT EXISTS clientes_tipo_codigo_uidx ON public.clientes (COALESCE(tipo,'Cliente'), codigo);