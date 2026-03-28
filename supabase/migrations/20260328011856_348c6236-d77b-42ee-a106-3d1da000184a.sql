
CREATE TABLE public.evidencias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer NOT NULL DEFAULT 0,
  titulo text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  tipo text DEFAULT 'Operacional',
  processo_vinculado text DEFAULT '',
  centro_custo_id text DEFAULT '',
  centro_custo_nome text DEFAULT '',
  setor text DEFAULT '',
  data_fato_gerador timestamp with time zone DEFAULT now(),
  data_registro timestamp with time zone DEFAULT now(),
  responsavel_registro text DEFAULT '',
  status text DEFAULT 'Pendente',
  observacoes text DEFAULT '',
  palavras_chave text DEFAULT '',
  anexos jsonb DEFAULT '[]'::jsonb,
  historico jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.evidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all evidencias" ON public.evidencias
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('evidencias-anexos', 'evidencias-anexos', true);

CREATE POLICY "Allow public upload evidencias-anexos" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'evidencias-anexos');

CREATE POLICY "Allow public read evidencias-anexos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'evidencias-anexos');

CREATE POLICY "Allow public update evidencias-anexos" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'evidencias-anexos')
  WITH CHECK (bucket_id = 'evidencias-anexos');

CREATE POLICY "Allow public delete evidencias-anexos" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'evidencias-anexos');
