CREATE OR REPLACE FUNCTION public.prevent_os_avaliacao_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.avaliacao IS NOT NULL THEN
    IF NEW.avaliacao IS DISTINCT FROM OLD.avaliacao
       OR COALESCE(NEW.avaliacao_justificativa,'') IS DISTINCT FROM COALESCE(OLD.avaliacao_justificativa,'')
       OR NEW.avaliacao_data IS DISTINCT FROM OLD.avaliacao_data
       OR COALESCE(NEW.avaliacao_usuario,'') IS DISTINCT FROM COALESCE(OLD.avaliacao_usuario,'') THEN
      RAISE EXCEPTION 'A avaliação desta OS já foi registrada e não pode ser alterada.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_os_avaliacao_change ON public.ordens_servico;
CREATE TRIGGER trg_prevent_os_avaliacao_change
BEFORE UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.prevent_os_avaliacao_change();