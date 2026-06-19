
CREATE TABLE public.os_modelos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.os_modelos TO authenticated, anon;
GRANT ALL ON public.os_modelos TO service_role;
ALTER TABLE public.os_modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all os_modelos" ON public.os_modelos FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.os_modelos (nome, descricao) VALUES ('Modelo_Saude', 'Modelo padrão de Ordem de Serviço (atual)') ON CONFLICT (nome) DO NOTHING;

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS modelo_os_id uuid REFERENCES public.os_modelos(id) ON DELETE SET NULL;

UPDATE public.clientes SET modelo_os_id = (SELECT id FROM public.os_modelos WHERE nome = 'Modelo_Saude') WHERE modelo_os_id IS NULL;
