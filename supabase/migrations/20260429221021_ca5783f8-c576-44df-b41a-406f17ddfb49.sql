-- Tabela RDO - Registro Diário de Obras
CREATE TABLE public.rdos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer NOT NULL DEFAULT 0,
  data_rdo date NOT NULL DEFAULT CURRENT_DATE,
  cliente_id text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL DEFAULT '',
  obra text NOT NULL DEFAULT '',
  responsavel text NOT NULL DEFAULT '',
  -- Clima por turno
  clima_manha text DEFAULT '',
  clima_tarde text DEFAULT '',
  clima_noite text DEFAULT '',
  condicao_manha text DEFAULT '',
  condicao_tarde text DEFAULT '',
  condicao_noite text DEFAULT '',
  -- Efetivo (mão de obra) - JSON: [{funcao, quantidade, horas}]
  efetivo jsonb DEFAULT '[]'::jsonb,
  -- Equipamentos - JSON: [{descricao, quantidade, horas}]
  equipamentos jsonb DEFAULT '[]'::jsonb,
  -- Atividades executadas - JSON: [{descricao, percentual_avanco, observacao}]
  atividades jsonb DEFAULT '[]'::jsonb,
  -- Avanço físico geral
  avanco_fisico_geral numeric DEFAULT 0,
  -- Ocorrências
  ocorrencias text DEFAULT '',
  observacoes text DEFAULT '',
  -- Anexos / Fotos - JSON: [{nome, url, tipo}]
  anexos jsonb DEFAULT '[]'::jsonb,
  -- Assinaturas (data URLs base64)
  assinatura_responsavel text DEFAULT '',
  assinatura_responsavel_nome text DEFAULT '',
  assinatura_fiscalizacao text DEFAULT '',
  assinatura_fiscalizacao_nome text DEFAULT '',
  status text DEFAULT 'Aberto',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rdos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all rdos" ON public.rdos FOR ALL TO public USING (true) WITH CHECK (true);

-- Trigger para auto-numeração
CREATE OR REPLACE FUNCTION public.set_next_rdo_numero()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero FROM public.rdos;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_next_rdo_numero
BEFORE INSERT ON public.rdos
FOR EACH ROW
EXECUTE FUNCTION public.set_next_rdo_numero();

-- Bucket para anexos do RDO
INSERT INTO storage.buckets (id, name, public) VALUES ('rdo-anexos', 'rdo-anexos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read rdo-anexos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'rdo-anexos');
CREATE POLICY "Public upload rdo-anexos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'rdo-anexos');
CREATE POLICY "Public update rdo-anexos" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'rdo-anexos');
CREATE POLICY "Public delete rdo-anexos" ON storage.objects FOR DELETE TO public USING (bucket_id = 'rdo-anexos');