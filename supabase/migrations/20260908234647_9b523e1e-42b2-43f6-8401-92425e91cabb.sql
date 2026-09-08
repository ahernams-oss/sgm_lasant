CREATE TABLE IF NOT EXISTS public.auditoria_historico (
  id uuid PRIMARY KEY,
  usuario_id uuid,
  usuario_nome text,
  usuario_email text,
  modulo text NOT NULL,
  acao text NOT NULL,
  entidade_id text,
  entidade_descricao text,
  dados_antes jsonb,
  dados_depois jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL,
  arquivado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auditoria_historico TO authenticated;
GRANT ALL ON public.auditoria_historico TO service_role;

ALTER TABLE public.auditoria_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditoria_historico_select_auth"
  ON public.auditoria_historico FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS auditoria_historico_created_at_idx ON public.auditoria_historico (created_at DESC);
CREATE INDEX IF NOT EXISTS auditoria_historico_modulo_idx ON public.auditoria_historico (modulo);
CREATE INDEX IF NOT EXISTS auditoria_historico_usuario_idx ON public.auditoria_historico (usuario_id);

CREATE OR REPLACE FUNCTION public.arquivar_auditoria(_dias integer DEFAULT 15)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _movidos integer;
BEGIN
  WITH movidos AS (
    DELETE FROM public.auditoria a
    WHERE a.created_at < now() - make_interval(days => _dias)
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

REVOKE ALL ON FUNCTION public.arquivar_auditoria(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.arquivar_auditoria(integer) TO service_role;