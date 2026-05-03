
-- Sequência de numeração
CREATE SEQUENCE IF NOT EXISTS bim_modelos_numero_seq START 1;

-- Tabela principal de modelos BIM
CREATE TABLE public.bim_modelos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer NOT NULL DEFAULT nextval('bim_modelos_numero_seq'),
  cliente_id text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL DEFAULT '',
  obra text NOT NULL DEFAULT '',
  nome text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  disciplina text NOT NULL DEFAULT 'Arquitetura',
  versao text NOT NULL DEFAULT '1.0',
  status text DEFAULT 'Em Revisão',
  responsavel_tecnico text DEFAULT '',
  data_upload date,
  formato text NOT NULL DEFAULT 'IFC',
  arquivo_url text DEFAULT '',
  arquivo_nome text DEFAULT '',
  arquivo_tamanho bigint DEFAULT 0,
  thumbnail_url text DEFAULT '',
  tags jsonb DEFAULT '[]'::jsonb,
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bim_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all bim_modelos" ON public.bim_modelos
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_bim_modelos_updated
  BEFORE UPDATE ON public.bim_modelos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quantitativos extraídos do modelo
CREATE TABLE public.bim_quantitativos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid NOT NULL REFERENCES public.bim_modelos(id) ON DELETE CASCADE,
  categoria text NOT NULL DEFAULT '',
  elemento text NOT NULL DEFAULT '',
  quantidade numeric NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'un',
  observacao text DEFAULT '',
  cronograma_atividade_id text DEFAULT '',
  cronograma_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bim_quantitativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all bim_quantitativos" ON public.bim_quantitativos
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_bim_quant_modelo ON public.bim_quantitativos(modelo_id);

-- Pranchas vinculadas
CREATE TABLE public.bim_pranchas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id uuid NOT NULL REFERENCES public.bim_modelos(id) ON DELETE CASCADE,
  codigo text NOT NULL DEFAULT '',
  titulo text NOT NULL DEFAULT '',
  escala text DEFAULT '',
  revisao text DEFAULT '00',
  data_revisao date,
  arquivo_url text DEFAULT '',
  arquivo_nome text DEFAULT '',
  observacao text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bim_pranchas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all bim_pranchas" ON public.bim_pranchas
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_bim_pranchas_modelo ON public.bim_pranchas(modelo_id);

-- Bucket público para arquivos BIM
INSERT INTO storage.buckets (id, name, public)
VALUES ('bim-arquivos', 'bim-arquivos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read bim-arquivos" ON storage.objects
  FOR SELECT USING (bucket_id = 'bim-arquivos');

CREATE POLICY "Public insert bim-arquivos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bim-arquivos');

CREATE POLICY "Public update bim-arquivos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'bim-arquivos');

CREATE POLICY "Public delete bim-arquivos" ON storage.objects
  FOR DELETE USING (bucket_id = 'bim-arquivos');
