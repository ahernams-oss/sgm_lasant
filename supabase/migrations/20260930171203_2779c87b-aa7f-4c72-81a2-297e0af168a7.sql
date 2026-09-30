DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='solicitacoes_servicos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_servicos;
  END IF;
END $$;