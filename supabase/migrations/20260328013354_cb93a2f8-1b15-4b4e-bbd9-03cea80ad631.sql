
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT '',
  descricao TEXT DEFAULT '',
  categoria TEXT DEFAULT '',
  itens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all checklists" ON public.checklists FOR ALL TO public USING (true) WITH CHECK (true);

CREATE TABLE public.checklist_preenchimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE NOT NULL,
  checklist_titulo TEXT DEFAULT '',
  evidencia_id UUID REFERENCES public.evidencias(id) ON DELETE SET NULL,
  evidencia_titulo TEXT DEFAULT '',
  itens JSONB DEFAULT '[]'::jsonb,
  percentual_conformidade NUMERIC DEFAULT 0,
  responsavel TEXT DEFAULT '',
  data_preenchimento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  observacoes TEXT DEFAULT '',
  status TEXT DEFAULT 'Pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.checklist_preenchimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all checklist_preenchimentos" ON public.checklist_preenchimentos FOR ALL TO public USING (true) WITH CHECK (true);
