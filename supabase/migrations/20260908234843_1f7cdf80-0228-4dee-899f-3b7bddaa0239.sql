CREATE OR REPLACE FUNCTION public.arquivar_auditoria(_dias integer DEFAULT 15, _lote integer DEFAULT 200)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _movidos integer;
BEGIN
  WITH alvo AS (
    SELECT id FROM public.auditoria
    WHERE created_at < now() - make_interval(days => _dias)
    ORDER BY created_at
    LIMIT _lote
    FOR UPDATE SKIP LOCKED
  ), movidos AS (
    DELETE FROM public.auditoria a
    USING alvo WHERE a.id = alvo.id
    RETURNING a.*
  ), inseridos AS (
    INSERT INTO public.auditoria_historico (
      id, usuario_id, usuario_nome, usuario_email, modulo, acao,
      entidade_id, entidade_descricao, dados_antes, dados_depois,
      ip, user_agent, created_at
    )
    SELECT id, usuario_id, usuario_nome, usuario_email, modulo, acao,
           entidade_id, entidade_descricao, dados_antes, dados_depois,
           ip, user_agent, created_at
    FROM movidos
    ON CONFLICT (id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::int INTO _movidos FROM inseridos;

  RETURN _movidos;
END;
$$;

REVOKE ALL ON FUNCTION public.arquivar_auditoria(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arquivar_auditoria(integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.arquivar_auditoria_ciclo(_dias integer DEFAULT 15)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tot integer := 0;
  _n integer;
BEGIN
  LOOP
    _n := public.arquivar_auditoria(_dias, 100);
    _tot := _tot + _n;
    EXIT WHEN _n = 0 OR _tot >= 20000;
  END LOOP;
  RETURN _tot;
END;
$$;

REVOKE ALL ON FUNCTION public.arquivar_auditoria_ciclo(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arquivar_auditoria_ciclo(integer) TO service_role;