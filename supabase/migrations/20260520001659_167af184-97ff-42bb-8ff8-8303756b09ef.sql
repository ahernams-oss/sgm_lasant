
-- Targeting columns on avisos: empty/null arrays = broadcast para todos
ALTER TABLE public.comunicacao_avisos
  ADD COLUMN IF NOT EXISTS destinatarios_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS grupos_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Grupos de comunicação
CREATE TABLE IF NOT EXISTS public.comunicacao_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  membros_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_por text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comunicacao_grupos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all comunicacao_grupos" ON public.comunicacao_grupos;
CREATE POLICY "Allow all comunicacao_grupos" ON public.comunicacao_grupos
  FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_comunicacao_grupos_updated_at ON public.comunicacao_grupos;
CREATE TRIGGER update_comunicacao_grupos_updated_at
  BEFORE UPDATE ON public.comunicacao_grupos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicacao_grupos;
