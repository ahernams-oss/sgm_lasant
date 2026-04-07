
CREATE OR REPLACE FUNCTION public.set_next_os_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.ordens_servico;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_os_numero ON public.ordens_servico;
CREATE TRIGGER trg_set_os_numero
  BEFORE INSERT ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.set_next_os_numero();
