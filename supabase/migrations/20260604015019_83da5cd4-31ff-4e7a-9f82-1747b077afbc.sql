DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.comunicacao_notificacoes;
  EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.comunicacao_mensagens;
  EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.pregao_participantes;
  EXCEPTION WHEN undefined_object THEN NULL; WHEN undefined_table THEN NULL; END;
END $$;