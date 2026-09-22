
WITH dups AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY numero ORDER BY created_at, id) AS rn
  FROM public.requisicoes
  WHERE numero IN (SELECT numero FROM public.requisicoes GROUP BY numero HAVING count(*) > 1)
),
base AS (SELECT COALESCE(MAX(numero),0) AS m FROM public.requisicoes),
renum AS (
  SELECT d.id, (SELECT m FROM base) + ROW_NUMBER() OVER (ORDER BY d.id) AS novo
  FROM dups d WHERE d.rn > 1
)
UPDATE public.requisicoes r SET numero = renum.novo FROM renum WHERE r.id = renum.id;

CREATE UNIQUE INDEX IF NOT EXISTS requisicoes_numero_key ON public.requisicoes(numero);

CREATE OR REPLACE FUNCTION public.set_next_requisicao_numero()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero <= 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('requisicoes_numero'));
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.requisicoes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_requisicoes_numero ON public.requisicoes;
CREATE TRIGGER trg_requisicoes_numero
BEFORE INSERT ON public.requisicoes
FOR EACH ROW EXECUTE FUNCTION public.set_next_requisicao_numero();
