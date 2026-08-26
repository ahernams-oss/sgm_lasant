ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS cod_lasant text;

CREATE SEQUENCE IF NOT EXISTS public.equipamentos_cod_lasant_seq;

CREATE OR REPLACE FUNCTION public.set_equipamento_cod_lasant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.cod_lasant IS NULL OR trim(NEW.cod_lasant) = '' THEN
    NEW.cod_lasant := 'LST-' || lpad(nextval('public.equipamentos_cod_lasant_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_equipamentos_cod_lasant ON public.equipamentos;
CREATE TRIGGER trg_equipamentos_cod_lasant
BEFORE INSERT ON public.equipamentos
FOR EACH ROW EXECUTE FUNCTION public.set_equipamento_cod_lasant();

CREATE UNIQUE INDEX IF NOT EXISTS equipamentos_cod_lasant_key ON public.equipamentos (cod_lasant);