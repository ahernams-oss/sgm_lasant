
ALTER TABLE public.ferramentas_vinculos 
ADD COLUMN ferramentas_ids jsonb DEFAULT '[]'::jsonb,
ADD COLUMN ferramentas_descricoes jsonb DEFAULT '[]'::jsonb;
