CREATE TABLE public.boletins_medicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer,
  ano integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  cliente_id uuid,
  cliente_nome text,
  contrato_numero text,
  processo_numero text,
  objeto text,
  obra text,
  responsavel_tecnico text,
  valor_total_contrato numeric NOT NULL DEFAULT 0,
  data_emissao date DEFAULT CURRENT_DATE,
  frentes jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Em elaboração',
  observacoes text,
  enviado_cliente boolean NOT NULL DEFAULT false,
  data_envio timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boletins_medicao TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boletins_medicao TO anon;
GRANT ALL ON public.boletins_medicao TO service_role;

ALTER TABLE public.boletins_medicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read boletins_medicao" ON public.boletins_medicao FOR SELECT USING (true);
CREATE POLICY "Public insert boletins_medicao" ON public.boletins_medicao FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update boletins_medicao" ON public.boletins_medicao FOR UPDATE USING (true);
CREATE POLICY "Public delete boletins_medicao" ON public.boletins_medicao FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_next_boletim_medicao_numero()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.ano IS NULL THEN
    NEW.ano := EXTRACT(YEAR FROM now());
  END IF;
  IF NEW.numero IS NULL THEN
    SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
    FROM public.boletins_medicao
    WHERE ano = NEW.ano;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_next_boletim_medicao_numero
BEFORE INSERT ON public.boletins_medicao
FOR EACH ROW EXECUTE FUNCTION public.set_next_boletim_medicao_numero();