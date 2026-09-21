
-- 1) Renumerar duplicados (mantém o mais antigo de cada grupo)
WITH ranked AS (
  SELECT id, numero,
         row_number() OVER (PARTITION BY numero ORDER BY created_at) AS rn,
         row_number() OVER (ORDER BY created_at) AS ord
  FROM public.requisicoes_compras
  WHERE numero IS NOT NULL
),
dups AS (
  SELECT id, row_number() OVER (ORDER BY ord) AS seq
  FROM ranked WHERE rn > 1
),
base AS (
  SELECT COALESCE(MAX(numero), 0) AS m FROM public.requisicoes_compras
)
UPDATE public.requisicoes_compras r
SET numero = base.m + dups.seq
FROM dups, base
WHERE r.id = dups.id;

-- 2) Numeração automática com trava transacional
CREATE OR REPLACE FUNCTION public.set_next_requisicao_compras_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('requisicoes_compras_numero'));
  SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.requisicoes_compras;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requisicoes_compras_numero ON public.requisicoes_compras;
CREATE TRIGGER trg_requisicoes_compras_numero
BEFORE INSERT ON public.requisicoes_compras
FOR EACH ROW EXECUTE FUNCTION public.set_next_requisicao_compras_numero();

-- 3) Garantia definitiva
CREATE UNIQUE INDEX IF NOT EXISTS requisicoes_compras_numero_key
ON public.requisicoes_compras (numero);
