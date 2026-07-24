
ALTER TABLE public.scos ADD COLUMN IF NOT EXISTS familia text;

CREATE OR REPLACE FUNCTION public.trg_scos_set_familia()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_desc text;
BEGIN
  IF NEW.cod_sco IS NULL OR length(NEW.cod_sco) < 2 THEN
    RETURN NEW;
  END IF;

  -- Try 3-letter prefix (elementares) first
  v_prefix := upper(substring(NEW.cod_sco from 1 for 3));
  SELECT descricao INTO v_desc FROM public.sco_categorias
    WHERE codigo = v_prefix AND tipo = 'elementar' LIMIT 1;

  IF v_desc IS NULL THEN
    v_prefix := upper(substring(NEW.cod_sco from 1 for 2));
    SELECT descricao INTO v_desc FROM public.sco_categorias
      WHERE codigo = v_prefix AND tipo = 'servico' LIMIT 1;
  END IF;

  IF v_desc IS NOT NULL THEN
    NEW.familia := v_prefix || ' - ' || v_desc;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scos_familia ON public.scos;
CREATE TRIGGER trg_scos_familia
  BEFORE INSERT OR UPDATE OF cod_sco ON public.scos
  FOR EACH ROW EXECUTE FUNCTION public.trg_scos_set_familia();

UPDATE public.scos SET cod_sco = cod_sco WHERE familia IS NULL;
