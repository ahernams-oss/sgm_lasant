CREATE OR REPLACE FUNCTION public.strip_anexo_base64(_a jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _a IS NULL OR jsonb_typeof(_a) <> 'object' THEN _a
    ELSE jsonb_strip_nulls(
      (_a - 'base64')
      || jsonb_build_object('base64', ''::text, 'temAnexo', (_a ? 'base64'))
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.processos_seletivos_leves()
RETURNS TABLE (
  id uuid,
  requisicao_id text,
  data_criacao text,
  candidatos jsonb,
  created_at timestamptz,
  numero integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.requisicao_id,
    p.data_criacao,
    COALESCE((
      SELECT jsonb_agg(
        (c - 'anexos' - 'documentos' - 'exameAdmissional')
        || jsonb_build_object(
             'anexos', COALESCE((
               SELECT jsonb_agg(public.strip_anexo_base64(a))
               FROM jsonb_array_elements(COALESCE(c->'anexos','[]'::jsonb)) a
             ), '[]'::jsonb),
             'documentos', COALESCE((
               SELECT jsonb_agg(
                 CASE WHEN d ? 'anexo' AND jsonb_typeof(d->'anexo') = 'object'
                      THEN jsonb_set(d, '{anexo}', public.strip_anexo_base64(d->'anexo'))
                      ELSE d END
               )
               FROM jsonb_array_elements(COALESCE(c->'documentos','[]'::jsonb)) d
             ), '[]'::jsonb),
             'exameAdmissional',
               CASE WHEN jsonb_typeof(c->'exameAdmissional') = 'object'
                      AND (c->'exameAdmissional') ? 'anexo'
                      AND jsonb_typeof(c->'exameAdmissional'->'anexo') = 'object'
                    THEN jsonb_set(c->'exameAdmissional', '{anexo}', public.strip_anexo_base64(c->'exameAdmissional'->'anexo'))
                    ELSE COALESCE(c->'exameAdmissional', 'null'::jsonb) END
           )
        ORDER BY ord
      )
      FROM jsonb_array_elements(COALESCE(p.candidatos, '[]'::jsonb)) WITH ORDINALITY AS t(c, ord)
    ), '[]'::jsonb) AS candidatos,
    p.created_at,
    p.numero
  FROM public.processos_seletivos p
  ORDER BY p.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.processos_seletivos_leves() TO anon, authenticated, service_role;