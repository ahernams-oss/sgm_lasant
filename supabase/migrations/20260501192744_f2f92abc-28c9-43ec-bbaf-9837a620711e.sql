-- Habilita pgvector para busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- ============ Categorias ============
CREATE TABLE public.kb_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  cor TEXT DEFAULT '#673ab7',
  icone TEXT DEFAULT 'BookOpen',
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kb_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all kb_categorias" ON public.kb_categorias FOR ALL USING (true) WITH CHECK (true);

-- ============ Artigos ============
CREATE TABLE public.kb_artigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  resumo TEXT DEFAULT '',
  conteudo TEXT NOT NULL DEFAULT '',
  categoria_id UUID REFERENCES public.kb_categorias(id) ON DELETE SET NULL,
  categoria_nome TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  anexos JSONB DEFAULT '[]'::jsonb,
  autor_email TEXT DEFAULT '',
  autor_nome TEXT DEFAULT '',
  status TEXT DEFAULT 'publicado', -- rascunho | publicado | arquivado
  visualizacoes INTEGER DEFAULT 0,
  uteis INTEGER DEFAULT 0,
  nao_uteis INTEGER DEFAULT 0,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kb_artigos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all kb_artigos" ON public.kb_artigos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_kb_artigos_categoria ON public.kb_artigos(categoria_id);
CREATE INDEX idx_kb_artigos_status ON public.kb_artigos(status);
CREATE INDEX idx_kb_artigos_embedding ON public.kb_artigos USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER kb_artigos_updated_at
BEFORE UPDATE ON public.kb_artigos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FAQ ============
CREATE TABLE public.kb_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL DEFAULT '',
  categoria_id UUID REFERENCES public.kb_categorias(id) ON DELETE SET NULL,
  categoria_nome TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  ordem INTEGER DEFAULT 0,
  visualizacoes INTEGER DEFAULT 0,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kb_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all kb_faq" ON public.kb_faq FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_kb_faq_categoria ON public.kb_faq(categoria_id);
CREATE INDEX idx_kb_faq_embedding ON public.kb_faq USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER kb_faq_updated_at
BEFORE UPDATE ON public.kb_faq
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Vínculo Artigo <-> Equipamento ============
CREATE TABLE public.kb_artigo_equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id UUID NOT NULL REFERENCES public.kb_artigos(id) ON DELETE CASCADE,
  equipamento_id TEXT NOT NULL,
  equipamento_descricao TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kb_artigo_equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all kb_artigo_equipamentos" ON public.kb_artigo_equipamentos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_kb_art_eq_artigo ON public.kb_artigo_equipamentos(artigo_id);
CREATE INDEX idx_kb_art_eq_equip ON public.kb_artigo_equipamentos(equipamento_id);

-- ============ Vínculo Artigo <-> OS ============
CREATE TABLE public.kb_artigo_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artigo_id UUID NOT NULL REFERENCES public.kb_artigos(id) ON DELETE CASCADE,
  os_id TEXT NOT NULL,
  os_numero INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kb_artigo_os ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all kb_artigo_os" ON public.kb_artigo_os FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_kb_art_os_artigo ON public.kb_artigo_os(artigo_id);

-- ============ RPC: busca semântica ============
CREATE OR REPLACE FUNCTION public.kb_buscar_semantico(
  query_embedding vector(768),
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  tipo TEXT,
  id UUID,
  titulo TEXT,
  conteudo TEXT,
  categoria_nome TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 'artigo'::TEXT AS tipo, a.id, a.titulo,
         COALESCE(a.resumo,'') || E'\n\n' || COALESCE(a.conteudo,'') AS conteudo,
         a.categoria_nome,
         1 - (a.embedding <=> query_embedding) AS similarity
  FROM public.kb_artigos a
  WHERE a.embedding IS NOT NULL
    AND a.status = 'publicado'
    AND 1 - (a.embedding <=> query_embedding) > match_threshold
  UNION ALL
  SELECT 'faq'::TEXT AS tipo, f.id, f.pergunta AS titulo,
         f.resposta AS conteudo,
         f.categoria_nome,
         1 - (f.embedding <=> query_embedding) AS similarity
  FROM public.kb_faq f
  WHERE f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- ============ Bucket de anexos ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('kb-anexos', 'kb-anexos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "kb-anexos public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'kb-anexos');

CREATE POLICY "kb-anexos public insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kb-anexos');

CREATE POLICY "kb-anexos public update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'kb-anexos');

CREATE POLICY "kb-anexos public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'kb-anexos');

-- ============ Categorias iniciais ============
INSERT INTO public.kb_categorias (nome, cor, icone, ordem) VALUES
  ('Elétrica', '#f59e0b', 'Zap', 1),
  ('Hidráulica', '#3b82f6', 'Droplets', 2),
  ('HVAC / Climatização', '#06b6d4', 'Fan', 3),
  ('Mecânica', '#6b7280', 'Wrench', 4),
  ('Civil / Estrutura', '#a16207', 'Building2', 5),
  ('Segurança do Trabalho', '#dc2626', 'ShieldCheck', 6),
  ('Procedimentos Gerais', '#673ab7', 'BookOpen', 7);