CREATE OR REPLACE FUNCTION public.strip_anexo_base64(_a jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _a IS NULL OR jsonb_typeof(_a) <> 'object' THEN _a
    ELSE jsonb_strip_nulls(
      (_a - 'base64')
      || jsonb_build_object('base64', ''::text, 'temAnexo', (_a ? 'base64'))
    )
  END;
$$;

ALTER FUNCTION public.processos_seletivos_leves() SECURITY INVOKER;