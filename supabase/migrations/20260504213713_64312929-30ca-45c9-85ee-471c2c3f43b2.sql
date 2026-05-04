
-- Drop default sequence on solicitacoes_servicos.numero so we can compute via trigger
ALTER TABLE public.solicitacoes_servicos ALTER COLUMN numero DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.set_next_ss_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.solicitacoes_servicos
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_next_ss_numero ON public.solicitacoes_servicos;
CREATE TRIGGER trg_set_next_ss_numero
BEFORE INSERT ON public.solicitacoes_servicos
FOR EACH ROW EXECUTE FUNCTION public.set_next_ss_numero();

-- Update OS numero function to reset per year
CREATE OR REPLACE FUNCTION public.set_next_os_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.ordens_servico
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_next_os_numero ON public.ordens_servico;
CREATE TRIGGER trg_set_next_os_numero
BEFORE INSERT ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION public.set_next_os_numero();
