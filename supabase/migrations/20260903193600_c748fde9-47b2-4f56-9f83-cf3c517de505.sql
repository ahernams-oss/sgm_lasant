CREATE OR REPLACE FUNCTION public.set_next_cliente_codigo()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.codigo IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('clientes_codigo_' || COALESCE(NEW.tipo,'Cliente')));
    SELECT COALESCE(MAX(codigo), 0) + 1 INTO NEW.codigo
    FROM public.clientes
    WHERE COALESCE(tipo,'Cliente') = COALESCE(NEW.tipo,'Cliente');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_os_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('os_numero_' || v_year));
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.ordens_servico
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_ss_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('ss_numero_' || v_year));
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.solicitacoes_servicos
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_orcamento_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('orcamento_numero_' || v_year));
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.orcamentos
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_orcamento_sco_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('orcamento_sco_numero_' || v_year));
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.orcamentos_sco
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_boletim_medicao_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.ano IS NULL THEN
    NEW.ano := EXTRACT(YEAR FROM now());
  END IF;
  IF NEW.numero IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('boletim_medicao_numero_' || NEW.ano));
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.boletins_medicao
    WHERE ano = NEW.ano;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_rdo_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    IF NEW.obra_id IS NOT NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('rdo_numero_obra_' || NEW.obra_id::text));
      SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.rdos WHERE obra_id = NEW.obra_id;
    ELSE
      PERFORM pg_advisory_xact_lock(hashtext('rdo_numero_cli_' || COALESCE(NEW.cliente_id::text,'') || '_' || COALESCE(NEW.obra,'')));
      SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.rdos WHERE cliente_id = NEW.cliente_id AND obra = NEW.obra;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_contrato_terceiro_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('contrato_terceiro_numero_' || v_year));
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.contratos_terceiros
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_eventograma_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('eventograma_numero_' || v_year));
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.eventogramas
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_laudo_condenacao_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year INT;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::INT;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('laudo_condenacao_numero_' || v_year));
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.equipamentos_laudos_condenacao
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::INT = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_pregao_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year INT;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::INT;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('pregao_numero_' || v_year));
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.pregoes
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::INT = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_processo_seletivo_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('processo_seletivo_numero_' || v_year));
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.processos_seletivos
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_next_nfse_numero()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.numero_dps IS NULL OR NEW.numero_dps = 0 THEN
    PERFORM pg_advisory_xact_lock(hashtext('nfse_numero_' || COALESCE(NEW.empresa_id::text,'') || '_' || COALESCE(NEW.ambiente,'') || '_' || COALESCE(NEW.serie,'')));
    SELECT COALESCE(MAX(numero_dps), 0) + 1 INTO NEW.numero_dps
    FROM public.nfses_emitidas
    WHERE COALESCE(empresa_id::text,'') = COALESCE(NEW.empresa_id::text,'')
      AND ambiente = NEW.ambiente
      AND serie = NEW.serie;
  END IF;
  RETURN NEW;
END;
$function$;