CREATE SEQUENCE IF NOT EXISTS obras_numero_seq START 1;

CREATE TABLE public.obras (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer NOT NULL DEFAULT nextval('obras_numero_seq'),
  cliente_id text NOT NULL DEFAULT '',
  cliente_nome text NOT NULL DEFAULT '',
  nome text NOT NULL DEFAULT '',
  descricao text DEFAULT '',
  endereco text DEFAULT '',
  responsavel text DEFAULT '',
  data_inicio date,
  data_prevista_termino date,
  status text DEFAULT 'Em Andamento',
  observacoes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all obras" ON public.obras
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_obras_updated_at
  BEFORE UPDATE ON public.obras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_obras_cliente ON public.obras(cliente_id);