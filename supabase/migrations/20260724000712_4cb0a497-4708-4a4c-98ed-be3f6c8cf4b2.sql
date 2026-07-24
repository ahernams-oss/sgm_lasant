
-- 1) Tabela de categorias SCO
CREATE TABLE IF NOT EXISTS public.sco_categorias (
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('servico','elementar')),
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (codigo, tipo)
);

GRANT SELECT ON public.sco_categorias TO anon, authenticated;
GRANT ALL ON public.sco_categorias TO service_role;

ALTER TABLE public.sco_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_sco_categorias" ON public.sco_categorias FOR SELECT USING (true);
CREATE POLICY "public_write_sco_categorias" ON public.sco_categorias FOR ALL USING (true) WITH CHECK (true);

-- 2) Popular categorias de SERVIÇOS
INSERT INTO public.sco_categorias (codigo, tipo, descricao) VALUES
  ('AD','servico','Administracao Local, Mobilizacao, Desmobilizacao e Apoio Tecnologico'),
  ('AL','servico','Alvenarias e Paredes Divisorias'),
  ('AP','servico','Aparelhos Hidraulicos, Sanitarios, Eletricos, Mecanicos e Esportivos'),
  ('BP','servico','Pavimentacao'),
  ('CE','servico','Consultoria Especializada'),
  ('CI','servico','Coberturas, Isolamentos e Impermeabilizacoes'),
  ('CO','servico','Canteiro de Obras'),
  ('DR','servico','Galerias, Drenos e Conexos'),
  ('EQ','servico','Equipamentos'),
  ('ES','servico','Esquadrias'),
  ('ET','servico','Estruturas'),
  ('FD','servico','Fundacoes'),
  ('IP','servico','Iluminacao Publica'),
  ('IT','servico','Instalacoes Eletricas, Hidraulicas, Sanitarias e Mecanicas'),
  ('MP','servico','Manutencao Preventiva e Corretiva'),
  ('MT','servico','Movimento de Terra'),
  ('PJ','servico','Servicos de Parques e Jardins'),
  ('PT','servico','Pinturas'),
  ('RV','servico','Revestimentos'),
  ('SC','servico','Servicos Complementares'),
  ('SE','servico','Servicos de Escritorio, Laboratorio e Campo'),
  ('ST','servico','Servicos de Engenharia de Trafego'),
  ('TC','servico','Transporte, Carga e Descarga')
ON CONFLICT (codigo, tipo) DO UPDATE SET descricao = EXCLUDED.descricao, updated_at = now();

-- 3) Popular categorias de ELEMENTARES
INSERT INTO public.sco_categorias (codigo, tipo, descricao) VALUES
  ('MAT','elementar','Materiais'),
  ('IEQ','elementar','Instrumentos e Equipamentos'),
  ('MOD','elementar','Mao-de-Obra Direta'),
  ('MOI','elementar','Mao-de-Obra Indireta'),
  ('EVE','elementar','Eventuais'),
  ('TRI','elementar','Tributos'),
  ('RSE','elementar','Reutilizacao de Servicos'),
  ('REQ','elementar','Reutilizacao de Instrumentos e Equipamentos')
ON CONFLICT (codigo, tipo) DO UPDATE SET descricao = EXCLUDED.descricao, updated_at = now();

-- 4) Backfill em sco_servicos: capítulo = prefixo (2 letras) do código
UPDATE public.sco_servicos s
   SET capitulo = c.codigo,
       capitulo_descricao = c.descricao
  FROM public.sco_categorias c
 WHERE c.tipo = 'servico'
   AND UPPER(SUBSTRING(TRIM(s.codigo) FROM 1 FOR 2)) = c.codigo
   AND (s.capitulo IS NULL OR s.capitulo = '' OR s.capitulo_descricao IS NULL OR s.capitulo_descricao = '');

-- 5) Backfill em sco_elementares: grupo = prefixo (3 letras) do código
UPDATE public.sco_elementares e
   SET grupo = c.codigo
  FROM public.sco_categorias c
 WHERE c.tipo = 'elementar'
   AND UPPER(SUBSTRING(TRIM(e.codigo) FROM 1 FOR 3)) = c.codigo
   AND (e.grupo IS NULL OR e.grupo = '');

-- 6) Trigger para vincular automaticamente ao inserir/atualizar
CREATE OR REPLACE FUNCTION public.sco_servico_set_categoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pref TEXT;
  desc_cat TEXT;
BEGIN
  pref := UPPER(SUBSTRING(TRIM(NEW.codigo) FROM 1 FOR 2));
  SELECT descricao INTO desc_cat FROM public.sco_categorias WHERE tipo = 'servico' AND codigo = pref;
  IF desc_cat IS NOT NULL THEN
    NEW.capitulo := pref;
    NEW.capitulo_descricao := desc_cat;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sco_servico_set_categoria ON public.sco_servicos;
CREATE TRIGGER trg_sco_servico_set_categoria
  BEFORE INSERT OR UPDATE OF codigo ON public.sco_servicos
  FOR EACH ROW EXECUTE FUNCTION public.sco_servico_set_categoria();

CREATE OR REPLACE FUNCTION public.sco_elementar_set_grupo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pref TEXT;
BEGIN
  pref := UPPER(SUBSTRING(TRIM(NEW.codigo) FROM 1 FOR 3));
  IF EXISTS (SELECT 1 FROM public.sco_categorias WHERE tipo = 'elementar' AND codigo = pref) THEN
    NEW.grupo := pref;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sco_elementar_set_grupo ON public.sco_elementares;
CREATE TRIGGER trg_sco_elementar_set_grupo
  BEFORE INSERT OR UPDATE OF codigo ON public.sco_elementares
  FOR EACH ROW EXECUTE FUNCTION public.sco_elementar_set_grupo();
