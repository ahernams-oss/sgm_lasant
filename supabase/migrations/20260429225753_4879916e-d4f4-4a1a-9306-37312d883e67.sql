CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.responsaveis_tecnicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  titulo TEXT NOT NULL,
  crea TEXT NOT NULL,
  cpf TEXT NOT NULL,
  carteira_crea_url TEXT,
  carteira_crea_nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.responsaveis_tecnicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rt_select" ON public.responsaveis_tecnicos FOR SELECT USING (true);
CREATE POLICY "rt_insert" ON public.responsaveis_tecnicos FOR INSERT WITH CHECK (true);
CREATE POLICY "rt_update" ON public.responsaveis_tecnicos FOR UPDATE USING (true);
CREATE POLICY "rt_delete" ON public.responsaveis_tecnicos FOR DELETE USING (true);

CREATE TRIGGER update_responsaveis_tecnicos_updated_at
  BEFORE UPDATE ON public.responsaveis_tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('responsaveis-tecnicos', 'responsaveis-tecnicos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "rt_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'responsaveis-tecnicos');
CREATE POLICY "rt_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'responsaveis-tecnicos');
CREATE POLICY "rt_storage_update" ON storage.objects FOR UPDATE USING (bucket_id = 'responsaveis-tecnicos');
CREATE POLICY "rt_storage_delete" ON storage.objects FOR DELETE USING (bucket_id = 'responsaveis-tecnicos');

ALTER TABLE public.rdos
  ADD COLUMN IF NOT EXISTS responsavel_tecnico_id UUID REFERENCES public.responsaveis_tecnicos(id);
