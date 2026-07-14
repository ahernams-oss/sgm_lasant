
-- Auto-assign orcamento numero yearly reset
CREATE OR REPLACE FUNCTION public.set_next_orcamento_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.orcamentos
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_set_next_orcamento_numero ON public.orcamentos;
CREATE TRIGGER trg_set_next_orcamento_numero
BEFORE INSERT ON public.orcamentos
FOR EACH ROW EXECUTE FUNCTION public.set_next_orcamento_numero();

-- Backfill existing rows (numero = 0) sequentially per year by created_at
WITH ordered AS (
  SELECT id,
         EXTRACT(YEAR FROM created_at)::int AS ano,
         ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at, id) AS rn
  FROM public.orcamentos
)
UPDATE public.orcamentos o
SET numero = ordered.rn
FROM ordered
WHERE o.id = ordered.id;
