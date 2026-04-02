
CREATE TABLE public.categorias_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  descricao TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.categorias_servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all categorias_servicos" ON public.categorias_servicos FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  descricao TEXT DEFAULT '',
  categoria_id UUID REFERENCES public.categorias_servicos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all servicos" ON public.servicos FOR ALL TO public USING (true) WITH CHECK (true);
