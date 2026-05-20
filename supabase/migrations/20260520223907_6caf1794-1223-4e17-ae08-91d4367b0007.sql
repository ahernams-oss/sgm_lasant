
CREATE TABLE public.eventogramas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL DEFAULT 0,
  cliente_id UUID,
  cliente_nome TEXT,
  obra TEXT NOT NULL,
  descricao TEXT,
  responsavel TEXT,
  contrato_numero TEXT,
  data_assinatura DATE,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  eventos JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Em elaboração',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eventogramas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read eventogramas" ON public.eventogramas FOR SELECT USING (true);
CREATE POLICY "Public insert eventogramas" ON public.eventogramas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update eventogramas" ON public.eventogramas FOR UPDATE USING (true);
CREATE POLICY "Public delete eventogramas" ON public.eventogramas FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_next_eventograma_numero()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_year int;
BEGIN
  v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, now()))::int;
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero
    FROM public.eventogramas
    WHERE EXTRACT(YEAR FROM COALESCE(created_at, now()))::int = v_year;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_eventogramas_numero
BEFORE INSERT ON public.eventogramas
FOR EACH ROW EXECUTE FUNCTION public.set_next_eventograma_numero();

CREATE TRIGGER trg_eventogramas_updated_at
BEFORE UPDATE ON public.eventogramas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
