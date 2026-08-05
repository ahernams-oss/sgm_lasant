ALTER TABLE public.processos_seletivos ADD COLUMN IF NOT EXISTS numero integer;

WITH ord AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM COALESCE(created_at, now()))::int ORDER BY created_at, id) AS rn
  FROM public.processos_seletivos
)
UPDATE public.processos_seletivos p SET numero = ord.rn FROM ord WHERE ord.id = p.id AND p.numero IS NULL;

CREATE OR REPLACE FUNCTION public.set_next_processo_seletivo_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.processos_seletivos
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_processos_seletivos_numero ON public.processos_seletivos;
CREATE TRIGGER trg_processos_seletivos_numero
BEFORE INSERT ON public.processos_seletivos
FOR EACH ROW EXECUTE FUNCTION public.set_next_processo_seletivo_numero();